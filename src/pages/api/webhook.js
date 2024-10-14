import { buffer } from 'micro'
import * as admin from 'firebase-admin'

export const config = {
  api: {
    bodyParser: false, // Desativa o bodyParser para lidar com o Stripe webhook
  },
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let buf
    try {
      buf = await buffer(req)
    } catch (err) {
      console.error('Erro ao obter o buffer:', err)
      return res.status(500).send('Erro ao processar o webhook.')
    }

    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Verificação da assinatura do webhook falhou:', err.message)
      return res.status(400).send(`Erro no Webhook: ${err.message}`)
    }

    console.log('Evento Stripe recebido:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      console.log('Dados da sessão de checkout:', session)

      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            limit: 1,
          }
        )

        console.log('Itens da sessão de checkout:', lineItems)

        const produtoId = session.metadata.produtoId // Obtem o produtoId do metadata
        const quantidadeComprada = lineItems.data[0].quantity

        console.log('Produto ID recebido do metadata:', produtoId)
        console.log('Quantidade comprada:', quantidadeComprada)

        const produtoRef = admin.firestore().doc(`Produtos/${produtoId}`)

        await admin.firestore().runTransaction(async transaction => {
          const produtoSnap = await transaction.get(produtoRef)

          if (!produtoSnap.exists) {
            throw new Error('Produto não encontrado.')
          }

          const produtoData = produtoSnap.data()
          const novaQuantidade = produtoData.Quantidade - quantidadeComprada

          if (novaQuantidade < 0) {
            throw new Error('Estoque insuficiente.')
          }

          transaction.update(produtoRef, { Quantidade: novaQuantidade })

          const vendaRef = admin.firestore().collection('Vendas')
          transaction.set(vendaRef.doc(), {
            Itens: [
              {
                produtoId,
                Quantidade: quantidadeComprada,
                Preço: session.amount_total / 100,
              },
            ],
            data: admin.firestore.Timestamp.now(),
          })
        })

        res.status(200).json({ received: true })
      } catch (error) {
        console.error('Erro ao processar o pagamento:', error.message)
        res.status(500).send('Erro no processamento do webhook.')
      }
    } else {
      res.status(400).end()
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Método ${req.method} não permitido`)
  }
}
