// Importações necessárias
import React, { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Função para carregar o Stripe

const Cart = () => {
  const [cartItems, setCartItems] = useState([])
  const [productQuantities, setProductQuantities] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const auth = getAuth()
  const user = auth.currentUser

  // Função para buscar os itens do carrinho
  useEffect(() => {
    const fetchCartItems = async () => {
      if (user) {
        try {
          const cartRef = doc(db, 'Carrinho', user.uid)
          const cartSnap = await getDoc(cartRef)

          if (cartSnap.exists()) {
            const { Itens } = cartSnap.data()
            console.log('Itens do carrinho:', Itens)

            if (Itens && Array.isArray(Itens)) {
              const initialQuantities = {}
              const validItems = Itens.filter(item => {
                if (item.Nome && item.Preco) {
                  initialQuantities[item.produtoId] = 1 // Inicia com 1
                  return true
                }
                return false
              })

              setProductQuantities(initialQuantities)
              console.log('Itens válidos do carrinho:', validItems)
              setCartItems(validItems)
            }
          }
        } catch (error) {
          console.error('Erro ao buscar itens do carrinho:', error)
        }
      }
    }

    fetchCartItems()
  }, [user])

  // Função para calcular o valor total do carrinho
  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = cartItems.reduce((acc, item) => {
        const quantity = productQuantities[item.produtoId] || 1
        return acc + item.Preco * quantity
      }, 0)
      setTotalPrice(total)
    }

    calculateTotalPrice()
  }, [cartItems, productQuantities])

  // Função para ajustar a quantidade do item no carrinho
  // Função para ajustar a quantidade do item no carrinho
  const ajustarQuantidade = async (
    produtoId,
    novaQuantidade,
    estoqueDisponivel
  ) => {
    if (novaQuantidade <= estoqueDisponivel && novaQuantidade > 0) {
      try {
        // Atualize o estado local com a nova quantidade
        setProductQuantities(prevQuantities => ({
          ...prevQuantities,
          [produtoId]: novaQuantidade,
        }))

        // Atualize a quantidade de forma local no array `cartItems`
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.produtoId === produtoId
              ? { ...item, quantidade: novaQuantidade }
              : item
          )
        )

        // Referência ao documento do carrinho do usuário no Firestore
        const cartRef = doc(db, 'Carrinho', user.uid)

        // Obtenha o documento atual do carrinho para modificar apenas o item específico
        const cartSnap = await getDoc(cartRef)
        if (cartSnap.exists()) {
          const cartData = cartSnap.data()
          const updatedItems = cartData.Itens.map(item =>
            item.produtoId === produtoId
              ? { ...item, quantidade: novaQuantidade }
              : item
          )

          // Atualize o array `Itens` no Firestore com a nova quantidade
          await updateDoc(cartRef, { Itens: updatedItems })
          console.log('Quantidade atualizada no banco de dados com sucesso!')
        }
      } catch (error) {
        console.error(
          'Erro ao atualizar a quantidade no banco de dados:',
          error
        )
      }
    } else {
      alert('A quantidade selecionada excede o estoque disponível.')
    }
  }

  // Função para remover um item do carrinho
  const removerDoCarrinho = async produtoId => {
    if (user) {
      try {
        const cartRef = doc(db, 'Carrinho', user.uid)
        const produtoRemover = cartItems.find(
          item => item.produtoId === produtoId
        )

        await updateDoc(cartRef, {
          Itens: arrayRemove(produtoRemover),
        })

        setCartItems(cartItems.filter(item => item.produtoId !== produtoId))
      } catch (error) {
        console.error('Erro ao remover item do carrinho:', error)
      }
    }
  }

  // Função para carregar o Stripe
  const loadStripe = () => {
    return new Promise(resolve => {
      if (window.Stripe) {
        console.log('Stripe já carregado:', window.Stripe)
        resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE)) // Substitua pela sua chave pública do Stripe
      } else {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.async = true
        script.onload = () => {
          console.log('Stripe carregado com sucesso:', window.Stripe)
          resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE)) // Substitua pela sua chave pública do Stripe
        }
        script.onerror = () => {
          console.error('Falha ao carregar o Stripe')
          resolve(null)
        }
        document.body.appendChild(script)
      }
    })
  }

  // Função para criar a sessão de checkout
  const criarCheckoutSession = async () => {
    const stripe = await loadStripe()
    if (!stripe) {
      toast.error('Erro ao carregar o Stripe', {
        position: 'top-center',
        autoClose: 2000,
      })
      return
    }

    const lineItems = cartItems.map(item => {
      const quantity = productQuantities[item.produtoId]
      return {
        produtoId: item.produtoId,
        Nome: item.Nome,
        Descrição: item.Descrição,
        quantity,
        price: item.Preco,
      }
    })

    console.log('Line items para o Stripe:', lineItems) // Verifique os itens

    try {
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItems: lineItems, productQuantities }), // Enviando os itens
      })

      const data = await response.json()
      console.log('Resposta da sessão de checkout:', data)

      if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) {
          console.error('Erro ao redirecionar para o checkout:', error)
          toast.error('Erro ao processar a compra', {
            position: 'top-center',
            autoClose: 2000,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao processar a compra:', error)
      toast.error('Erro ao processar a compra', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

  // Função para lidar com a compra
  const handleBuy = async () => {
    if (cartItems.length > 0) {
      await criarCheckoutSession()
    } else {
      toast.error(
        'Seu carrinho está vazio. Adicione produtos antes de comprar.',
        {
          position: 'top-center',
          autoClose: 2000,
        }
      )
    }
  }

  return (
    <div>
      <h2>Meu Carrinho</h2>
      {cartItems.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              <img
                src={item.Imagem || 'default-image-url'} // Verifique se a imagem está correta
                alt={item.Nome}
                style={{ width: '50px', height: '50px' }}
              />
              <p>
                {item.Nome} - R${item.Preco}
              </p>
              <p>Quantidade no carrinho: {productQuantities[item.produtoId]}</p>
              <button
                onClick={() =>
                  ajustarQuantidade(
                    item.produtoId,
                    productQuantities[item.produtoId] - 1,
                    item.Quantidade
                  )
                }
              >
                -
              </button>
              <button
                onClick={() =>
                  ajustarQuantidade(
                    item.produtoId,
                    productQuantities[item.produtoId] + 1,
                    item.Quantidade
                  )
                }
              >
                +
              </button>
              <button onClick={() => removerDoCarrinho(item.produtoId)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      {cartItems.length > 0 && (
        <>
          <h3>Valor Total do Carrinho: R${totalPrice.toFixed(2)}</h3>
          <button onClick={handleBuy}>Comprar</button>
        </>
      )}
    </div>
  )
}

export default Cart
