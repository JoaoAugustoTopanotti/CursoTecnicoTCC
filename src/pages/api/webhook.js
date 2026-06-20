import { buffer } from 'micro'
import Stripe from 'stripe'
import { admin, db } from '../../firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export const config = {
  // Desativa o bodyParser para receber o corpo bruto exigido pela assinatura do webhook.
  api: { bodyParser: false },
}

const ehFrete = item =>
  item.description === 'Frete' || item.type === 'shipping'

// Dá baixa no estoque dos produtos comprados em uma sessão de checkout.
async function darBaixaNoEstoque(produtoIds, itensDaLinha) {
  const itensVendidos = []

  for (let i = 0; i < itensDaLinha.length; i++) {
    const produtoId = produtoIds[i]
    const item = itensDaLinha[i]
    if (!produtoId || ehFrete(item)) continue

    const produtoRef = db.collection('Produtos').doc(produtoId)
    const quantidadeComprada = item.quantity

    await db.runTransaction(async transaction => {
      const produtoDoc = await transaction.get(produtoRef)
      if (!produtoDoc.exists) {
        throw new Error(`Produto não encontrado: ${produtoId}`)
      }

      const produto = produtoDoc.data()
      transaction.update(produtoRef, {
        Quantidade: produto.Quantidade - quantidadeComprada,
      })

      itensVendidos.push({
        produtoId,
        Nome: produto.Nome,
        Descricao: produto.Descricao,
        Imagem: produto.Imagem,
        Quantidade: quantidadeComprada,
        Subtotal: produto.Preco * quantidadeComprada,
      })
    })
  }

  return itensVendidos
}

async function registrarVenda(session, itensVendidos, frete) {
  await db.collection('Vendas').add({
    Itens: itensVendidos,
    PrecoTotal: itensVendidos.reduce((total, item) => total + item.Subtotal, 0),
    data: admin.firestore.Timestamp.now(),
    Frete: frete,
    Cliente: session.customer_email || 'Cliente não identificado',
  })
}

async function processarCheckoutConcluido(session) {
  let produtoIds = []
  try {
    produtoIds = JSON.parse(session.metadata.produtoIds)
  } catch (error) {
    console.error('Erro ao processar produtoIds:', error.message)
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

  const freteBruto = Number.parseFloat(session.metadata.deliveryFee)
  const frete = Number.isNaN(freteBruto) ? 0 : freteBruto

  const itensVendidos = await darBaixaNoEstoque(produtoIds, lineItems.data)
  await registrarVenda(session, itensVendidos, frete)
}

export default async function webhookHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Método não permitido')
  }

  const buf = await buffer(req)
  const assinatura = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, assinatura, endpointSecret)
  } catch (err) {
    console.error('Erro ao verificar assinatura do webhook:', err.message)
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed':
      try {
        await processarCheckoutConcluido(event.data.object)
      } catch (error) {
        console.error('Erro ao registrar a venda:', error)
      }
      break
    case 'payment_intent.payment_failed':
      console.error(
        `Pagamento falhou: ${event.data.object.last_payment_error?.message}`
      )
      break
    case 'checkout.session.async_payment_failed':
      console.error('Pagamento assíncrono falhou:', event.data.object.id)
      break
    default:
      // Eventos não tratados são ignorados silenciosamente.
      break
  }

  res.status(200).send('Webhook recebido.')
}
