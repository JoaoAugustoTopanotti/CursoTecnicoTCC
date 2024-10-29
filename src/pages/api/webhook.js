import { buffer } from 'micro'
import * as admin from 'firebase-admin'
import path from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

// Inicializa o Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const serviceAccount = require('../../../config/firebaseSecret.json')

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Inicializa o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

export const config = {
  api: {
    bodyParser: false, // Precisamos desativar o bodyParser para receber os eventos de webhook
  },
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export default async function webhookHandler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']

    let event

    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook:', err)
      return res.status(400).send(`Webhook error: ${err.message}`)
    }

    // Manipula os eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object

        console.log('Sessão de checkout completada:', session)

        if (session.metadata && session.metadata.produtoIds) {
          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id
          )
          const produtoIds = JSON.parse(session.metadata.produtoIds)
          console.log('IDs dos produtos comprados:', produtoIds)

          // Cria uma lista de todos os itens da venda
          const itensVendidos = []

          for (let i = 0; i < lineItems.data.length; i++) {
            const produtoId = produtoIds[i]
            console.log(lineItems.data[i].quantity)
            const quantidadeComprada = lineItems.data[i].quantity

            const produtoRef = db.collection('Produtos').doc(produtoId)

            await db.runTransaction(async transaction => {
              const produtoDoc = await transaction.get(produtoRef)
              if (!produtoDoc.exists) {
                throw new Error('Produto não encontrado')
              }

              const produtoData = produtoDoc.data()
              const novaQuantidade = produtoData.Quantidade - quantidadeComprada

              if (novaQuantidade < 0) {
                throw new Error('Estoque insuficiente.')
              }

              // Atualiza o estoque
              transaction.update(produtoRef, { Quantidade: novaQuantidade })

              // Adiciona o item vendido à lista
              itensVendidos.push({
                produtoId,
                Nome: produtoData.Nome,
                Descrição: produtoData.Descrição,
                Imagem: produtoData.Imagem,
                Quantidade: quantidadeComprada,
                Preço: lineItems.data[i].amount_total / 100, // Preço total por item
              })
            })
          }

          // Salva todos os itens comprados em um único documento na coleção 'Vendas'
          const vendaRef = db.collection('Vendas')
          const vendaData = {
            Itens: itensVendidos,
            Total: session.amount_total / 100,
            data: admin.firestore.Timestamp.now(),
            Cliente: session.customer_email || 'Cliente não identificado',
          }
          await vendaRef.add(vendaData)

          console.log('Venda registrada com sucesso:', vendaData)
        } else {
          console.error('Metadata ou produtoIds não estão presentes na sessão.')
        }
        break
      }
      case 'checkout.session.expired': {
        const sessionExpired = event.data.object
        console.log('Checkout session expired:', sessionExpired)
        break
      }
      case 'payment_intent.created': {
        const paymentIntent = event.data.object
        console.log('Payment intent created:', paymentIntent.id)
        break
      }

      case 'charge.updated': {
        const chargeUpdated = event.data.object
        console.log('Charge updated:', chargeUpdated.id, chargeUpdated.status)
        break
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log('Pagamento bem-sucedido:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const failureReason =
          paymentIntent.last_payment_error &&
          paymentIntent.last_payment_error.message
        console.error(`Pagamento falhou: ${failureReason}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Pagamento de fatura bem-sucedido:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.error(
          `Pagamento de fatura falhou para o cliente: ${invoice.customer}`
        )
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('Nova assinatura criada:', subscription.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Assinatura atualizada:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Assinatura cancelada:', subscription.id)
        break
      }

      default:
        console.warn(`Evento de webhook não processado: ${event.type}`)
    }

    res.status(200).send('Webhook recebido.')
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Método não permitido')
  }
}
