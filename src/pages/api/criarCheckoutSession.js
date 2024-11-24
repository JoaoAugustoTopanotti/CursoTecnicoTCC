import Stripe from 'stripe'

// Crie uma instância do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { cartItems, deliveryFee } = req.body

    let lineItems
    let produtoIds // Criação da variável para armazenar os IDs dos produtos

    console.log('Recebendo requisição para criar sessão de checkout:', req.body)

    // Validação dos parâmetros recebidos
    try {
      let totalQuantity = 0
      lineItems = cartItems.map(item => {
        if (!item.price || Number.isNaN(item.price)) {
          throw new Error(`Preço inválido para o produto: ${item.Nome}`)
        }
        console.log('Chegou')
        const unit_amount = Math.round(item.price * 100) // Preço em centavos
        const quantity = item.quantity || 1
        console.log('Chegou2')
        totalQuantity += quantity

        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.Nome,
              description: item.Descricao,
            },
            unit_amount,
          },
          quantity,
        }
      })
      console.log('Chegou3')

      // Adiciona o frete como um item separado (se aplicável)
      if (deliveryFee && !Number.isNaN(deliveryFee)) {
        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Frete',
              description: 'Taxa de entrega',
            },
            unit_amount: Math.round(deliveryFee * 100), // Frete em centavos
          },
          quantity: 1, // Sempre 1 para o frete
        })
      }

      console.log('Chegou4')
      // Captura os IDs dos produtos em uma variável separada
      produtoIds = [...new Set(cartItems.map(item => item.produtoId))] // Remove duplicatas
      console.log('Produto Ids: ')
      console.log(produtoIds)

      // Verifica se a quantidade em estoque é suficiente (pode ser um campo vindo da API do produto, por exemplo)
      cartItems.forEach(item => {
        if (item.quantity < item.quantity) {
          throw new Error(
            `Estoque insuficiente para o produto: ${item.Nome}. Disponível: ${item.quantity}`
          )
        }
      })
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }

    console.log('Chegou5')
    console.log('DeliveryFee: ')
    console.log(deliveryFee)

    try {
      // Cria uma sessão de checkout no Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.headers.origin}/sucesso`,
        cancel_url: `${req.headers.origin}/cancelado`,
        metadata: {
          produtoIds: JSON.stringify(produtoIds), // Usando a variável produtoIds
          deliveryFee: String(deliveryFee),
        },
      })

      // Retorna o ID da sessão para redirecionar ao checkout do Stripe
      console.log('Sessão de checkout criada com sucesso:', session)
      res.status(200).json({ success: true, sessionId: session.id })
    } catch (error) {
      console.error('Erro ao criar a sessão de checkout:', error)
      res.status(500).json({
        error: 'Erro ao processar a compra',
        details: error.message,
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Método ${req.method} não permitido`)
  }
}
