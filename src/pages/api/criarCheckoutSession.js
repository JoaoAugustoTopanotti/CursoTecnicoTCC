import Stripe from 'stripe'

// Crie uma instância do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { cartItems, produtoId, nome, descricao, preco, quantidade } =
      req.body

    let lineItems
    let produtoIds // Criação da variável para armazenar os IDs dos produtos

    console.log('Recebendo requisição para criar sessão de checkout:', req.body)

    // Validação dos parâmetros recebidos
    if (cartItems && cartItems.length > 0) {
      console.log('Itens no carrinho:', cartItems)

      // Se cartItems estiver presente, use-o
      lineItems = cartItems.map(item => {
        const unit_amount =
          item.price && !Number.isNaN(item.price)
            ? Math.round(item.price * 100)
            : 0

        // Validação dos campos nome e descrição
        if (!item.Nome || !item.Descrição) {
          throw new Error('Nome ou descrição do produto ausentes.')
        }

        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.Nome,
              description: item.Descrição,
            },
            unit_amount, // Preço em centavos
          },
          quantity: item.quantity || 1, // Quantidade variável, padrão para 1
        }
      })

      // Captura os IDs dos produtos em uma variável separada
      produtoIds = cartItems.map(item => item.produtoId)

      // Verifica se a quantidade em estoque é suficiente
      cartItems.forEach(item => {
        if (item.Quantidade < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para o produto: ${item.Nome}. Disponível: ${item.Quantidade}`
          )
        }
      })
    } else if (produtoId && nome && descricao && preco && quantidade) {
      // Caso contrário, valide e use os parâmetros do produto único
      const unit_amount = Math.round(preco * 100)

      if (!nome || !descricao) {
        return res
          .status(400)
          .json({ error: 'Nome ou descrição do produto ausentes.' })
      }

      lineItems = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: nome,
              description: descricao,
            },
            unit_amount, // Preço em centavos
          },
          quantity: quantidade || 1, // Quantidade do produto, padrão para 1
        },
      ]

      produtoIds = [produtoId] // Atribuição direta caso seja um produto único

      // Verifique o estoque do produto único
      if (req.body.Estoque < quantidade) {
        return res
          .status(400)
          .json({ error: `Estoque insuficiente para o produto: ${nome}.` })
      }
    } else {
      return res
        .status(400)
        .json({ error: 'Parâmetros obrigatórios ausentes.' })
    }
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
