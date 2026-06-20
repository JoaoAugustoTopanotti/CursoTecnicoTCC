// Inicia o checkout do Stripe: cria a sessão no backend e redireciona o usuário.
// Reúne em um só lugar o fluxo que estava repetido em cart.js e produtos/[id].js.

import { carregarStripe } from './stripe'
import { notificarErro } from './notificacoes'

export async function iniciarCheckout(dadosDoCarrinho) {
  const stripe = await carregarStripe()
  if (!stripe) {
    notificarErro('Erro ao carregar o Stripe')
    return
  }

  try {
    const resposta = await fetch('/api/criarCheckoutSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosDoCarrinho),
    })

    const dados = await resposta.json()
    if (dados.sessionId) {
      const { error } = await stripe.redirectToCheckout({ sessionId: dados.sessionId })
      if (error) throw error
    }
  } catch (error) {
    notificarErro('Erro ao processar a compra')
    console.error('Erro ao processar a compra:', error)
  }
}
