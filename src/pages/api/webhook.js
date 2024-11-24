import { buffer } from 'micro'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

// Inicializa o Firebase Admin se ainda não estiver inicializado
const serviceAccount = require('../../../config/firebaseSecret.json') // Certifique-se de que o caminho está correto

if (!admin.apps.length) {
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
    let deliveryFee = 0
    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook:', err.message)
      return res.status(400).send(`Webhook error: ${err.message}`)
    }
    console.log('Evento recebido:', JSON.stringify(event, null, 2))
    // Manipula os eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Evento recebido:', JSON.stringify(event, null, 2))
        console.log('Evento tipo:', event.type)

        const session = event.data.object
        console.log('Sessão recebida:', session) // Log da sessão recebida

        let produtoIds
        // Verificação e processamento de produtoIds
        try {
          produtoIds = JSON.parse(session.metadata.produtoIds)
          console.log('Produto IDs extraídos:', produtoIds)
        } catch (error) {
          console.error('Erro ao processar produtoIds:', error.message)
        }

        // Se você precisar dos itens da sessão, pode manter isso aqui
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        )
        console.log(lineItems) // Verifique os dados antes de acessar lineItems.data
        console.log(lineItems.data) // Agora deve ser possível acessar lineItems.data

        const rawDeliveryFee = session.metadata.deliveryFee

        console.log('Raw Delivery Fee:', rawDeliveryFee)
        // Verifique se os IDs de produto e os itens de linha coincidem
        console.log('Produto IDs:', produtoIds)
        console.log('Itens de linha:', lineItems)
        console.log(typeof lineItems) // Deve ser "object"
        console.log(lineItems instanceof Object) // Deve ser true

        // Convertendo deliveryFee para número (float) ou utilizando 0 como fallback
        deliveryFee = Number.parseFloat(rawDeliveryFee)

        if (Number.isNaN(deliveryFee)) {
          console.error('Erro: deliveryFee não é um número válido, usando 0.')
          deliveryFee = 0
        } else {
          console.log('Processed Delivery Fee:', deliveryFee)
        }
        console.log('Metadata da sessão recebida:', session.metadata)

        const itensVendidos = [] // Array para consolidar todos os itens vendidos
        console.log(typeof lineItems) // Deve ser "object"
        console.log(lineItems instanceof Object) // Deve ser true
        for (let i = 0; i < lineItems.data.length; i++) {
          const produtoId = produtoIds[i]
          const item = lineItems.data[i]
          const quantidadeComprada = lineItems.data[i].quantity
          if (
            !produtoId ||
            item.description === 'Frete' ||
            item.type === 'shipping'
          ) {
            console.log(
              `Ignorando item: ${item.description || 'Sem descrição'}`
            )
            continue // Pule este item e vá para o próximo
          }
          console.log('Chegou')

          const produtoRef = db.collection('Produtos').doc(produtoId)
          console.log('produtoId:', produtoId) // Verifique se o produtoId é válido
          console.log(produtoIds)
          await db.runTransaction(async transaction => {
            const produtoDoc = await transaction.get(produtoRef)
            if (!produtoDoc.exists) {
              throw new Error('Produto não encontrado')
            }
            const produtoData = produtoDoc.data()
            const novaQuantidade = produtoData.Quantidade - quantidadeComprada
            console.log('Nova quantidade: ')
            console.log(novaQuantidade)

            transaction.update(produtoRef, { Quantidade: novaQuantidade })
            console.log('ProdutoData.Preco: ')
            console.log(produtoData.Preco)

            // Adiciona o item ao array consolidado
            itensVendidos.push({
              produtoId,
              Nome: produtoData.Nome,
              Descricao: produtoData.Descricao,
              Imagem: produtoData.Imagem,
              Quantidade: quantidadeComprada, // Preço unitário do produto
              Subtotal: produtoData.Preco * quantidadeComprada, // Subtotal do item
            })
          })
        }
        console.log('9')
        // Adiciona um único documento na coleção Vendas
        const vendaRef = db.collection('Vendas')
        console.log('10')
        const vendaData = {
          Itens: itensVendidos,
          PrecoTotal: itensVendidos.reduce(
            (total, item) => total + item.Subtotal,
            0
          ), // Calcula o total da compra
          data: admin.firestore.Timestamp.now(),
          Frete: deliveryFee,
          Cliente: session.customer_email || 'Cliente não identificado',
        }
        console.log('11')
        try {
          await vendaRef.add(vendaData)
          console.log('12')
          console.log('Venda registrada com sucesso:', vendaData)
        } catch (error) {
          console.error('Erro ao registrar a venda:', error)
        }

        console.log('Venda registrada com sucesso:', vendaData)
        break
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log('Pagamento bem-sucedido:', paymentIntent.id)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const failureReason = paymentIntent.last_payment_error?.message // Usando o encadeamento opcional
        console.error(`Pagamento falhou: ${failureReason}`)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        console.log('Pagamento assíncrono bem-sucedido:', session.id)

        // Aqui você pode adicionar o que precisa para processar o evento
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object
        console.error('Pagamento assíncrono falhou:', session.id)

        // Aqui você pode adicionar o que precisa para processar o evento
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
