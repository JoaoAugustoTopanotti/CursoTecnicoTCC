// criarCheckoutSession.js
import Stripe from 'stripe'

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  console.log('Chegou na função de checkout')

  // Verifica se o método da requisição é POST
  if (req.method === 'POST') {
    const { priceID, Quantidade, produtoId } = req.body

    // Log dos dados recebidos
    console.log('Dados recebidos:', { priceID, Quantidade, produtoId })

    // Validação dos parâmetros
    if (!priceID || !Quantidade || !produtoId) {
      console.error('Faltando parâmetros obrigatórios')
      return res
        .status(400)
        .json({ error: 'Parâmetros obrigatórios ausentes.' })
    }

    try {
      console.log('Criando sessão de checkout no Stripe')
      console.log('Produto ID enviado para o Stripe:', produtoId) // Log do produtoId
      // Cria a sessão de checkout no Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceID,
            quantity: Quantidade,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/sucesso`,
        cancel_url: `${req.headers.origin}/cancelado`,
        metadata: {
          produtoId: produtoId, // ID do produto como metadata
        },
      })

      console.log('Sessão criada com sucesso:', session.id)
      res.status(200).json({ sessionId: session.id })
    } catch (error) {
      console.error('Erro ao criar a sessão de checkout:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    // Responde se o método não for permitido
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Método ${req.method} não permitido`)
  }
}
