import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function montarItensDaSessao(cartItems, deliveryFee) {
  const itens = cartItems.map(item => {
    if (!item.price || Number.isNaN(item.price)) {
      throw new Error(`Preço inválido para o produto: ${item.Nome}`)
    }

    return {
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.Nome,
          description: item.Descricao,
        },
        unit_amount: Math.round(item.price * 100), // Preço em centavos
      },
      quantity: item.quantity || 1,
    }
  })

  // Adiciona o frete como um item separado, quando houver.
  if (deliveryFee && !Number.isNaN(deliveryFee)) {
    itens.push({
      price_data: {
        currency: 'brl',
        product_data: { name: 'Frete', description: 'Taxa de entrega' },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    })
  }

  return itens
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Método ${req.method} não permitido`)
  }

  const { cartItems, deliveryFee } = req.body

  let lineItems
  try {
    lineItems = montarItensDaSessao(cartItems, deliveryFee)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  try {
    const produtoIds = [...new Set(cartItems.map(item => item.produtoId))]

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/sucesso`,
      cancel_url: `${req.headers.origin}/cancelado`,
      metadata: {
        produtoIds: JSON.stringify(produtoIds),
        deliveryFee: String(deliveryFee),
      },
    })

    res.status(200).json({ success: true, sessionId: session.id })
  } catch (error) {
    console.error('Erro ao criar a sessão de checkout:', error)
    res.status(500).json({
      error: 'Erro ao processar a compra',
      details: error.message,
    })
  }
}
