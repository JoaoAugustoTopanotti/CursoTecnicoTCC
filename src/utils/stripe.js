// Carrega o SDK do Stripe sob demanda e devolve a instância já configurada.
// Antes essa lógica estava duplicada em cart.js e em produtos/[id].js.

export function carregarStripe() {
  return new Promise(resolve => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const criarInstancia = () => resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE))

    if (window.Stripe) {
      criarInstancia()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = criarInstancia
    script.onerror = () => resolve(null)
    document.body.appendChild(script)
  })
}
