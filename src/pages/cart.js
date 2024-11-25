// Importações necessárias
import React, { useEffect, useState, useCallback } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { ToastContainer, toast } from 'react-toastify'
import { useAuth } from '../components/authContext'
import Modal from 'react-modal'
import style from './Modal.module.css'
import styles from './Cart.module.css'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/router'
import { collection, query, getDocs, where } from 'firebase/firestore'

// Função para carregar o Stripe

const Cart = () => {
  const [cartItems, setCartItems] = useState([])
  const [productQuantities, setProductQuantities] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState('store') // Default to store pickup
  const [enderecoUsuario, setEnderecoUsuario] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0) // Delivery fee amount
  const [frete, setFrete] = useState(0)
  const [produto, setProduto] = useState({
  
    PrecoBase: 0,
    PrecoComEntrega: 0,
    // Add other fields if needed
  })
  const auth = getAuth()
  const user = auth.currentUser
  const { currentUser, logout } = useAuth()
  const [petNotifications, setPetNotifications] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchPetData = async () => {
      if (currentUser) {
        const q = query(
          collection(db, 'Pets'),
          where('UsuarioID', '==', currentUser.uid)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const notifications = []

          querySnapshot.forEach(doc => {
            const petData = doc.data()
            const nextVaccinationDate = petData.PróximaVacinação.toDate()
            const today = new Date()
            const timeDiff = nextVaccinationDate - today
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

            let color = ''
            if (daysDiff <= 10) {
              color = 'red'
            } else if (daysDiff > 10 && daysDiff <= 20) {
              color = 'yellow'
            } else {
              color = 'green'
            }

            notifications.push({
              petName: petData.Nome,
              daysUntilVaccination: daysDiff,
              color,
            })
          })

          setPetNotifications(notifications)
        }
      }
    }

    const fetchProducts = async () => {
      const q = query(collection(db, 'Produtos'))
      const querySnapshot = await getDocs(q)

      const productsList = []
      querySnapshot.forEach(doc => {
        const productData = doc.data()
        productsList.push({
          id: doc.id,
          nome: productData.Nome,
          descricao: productData.Descricao,
          quantidade: productData.Quantidade,
          imagem: productData.Imagem,
          preco: productData.Preco,
        })
      })

      setProducts(productsList)
    }

    fetchPetData()
    fetchProducts()
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await logout()
      clearNotifications()
      console.log('Usuário deslogado com sucesso.')
      router.push('/')
    } catch (error) {
      console.error('Erro ao deslogar:', error)
    }
  }

  const clearNotifications = () => {
    setPetNotifications([])
  }

  const handleSchedulingClick = () => {
    if (currentUser) {
      router.push('/agendamento')
    } else {
      router.push('Autenticacao/login')
    }
  }
  const handleCartClick = () => {
    if (currentUser) {
      router.push('/cart')
    } else {
      router.push('Autenticacao/login')
    }
  }

  const handleProductClick = productId => {
    if (currentUser) {
      router.push(`/produtos/${productId}`)
    } else {
      router.push('Autenticacao/login')
    }
  }

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )


  // Função para buscar os itens do carrinho
  useEffect(() => {
    const fetchCartItems = async () => {
      if (user && user.uid) {
        // Certifique-se de que o user.uid está definido
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
      } else {
        console.warn('Usuário não está autenticado ou UID não está disponível.')
      }
    }

    fetchCartItems()
  }, [user])

  useEffect(() => {
    const buscarEnderecoUsuario = async () => {
      if (currentUser?.uid) {
        // Verifica se o currentUser e uid existem
        const usuarioId = currentUser.uid // Usa o uid como ID do usuário
        const usuarioRef = doc(db, 'Usuario', usuarioId)
        const usuarioSnap = await getDoc(usuarioRef)
        if (usuarioSnap.exists()) {
          setEnderecoUsuario(usuarioSnap.data().Endereco)
        } else {
          console.error('Endereço do usuário não encontrado')
        }
      }
    }
    buscarEnderecoUsuario()
  }, [currentUser])

  // Função para calcular o valor total do carrinho
  const calculateTotal = useCallback(() => {
    let itemTotal = 0
    cartItems.forEach(item => {
      const itemPrice = parseFloat(item.Preco) || 0
      const quantity = productQuantities[item.produtoId] || 1
      itemTotal += itemPrice * quantity
    })

    // Aplica a taxa de entrega se a opção for 'delivery', senão é zero
    console.log(deliveryFee)
    const totalWithDelivery = itemTotal + deliveryFee
    setTotalPrice(totalWithDelivery)
  }, [cartItems, productQuantities, deliveryFee])

  useEffect(() => calculateTotal(), [calculateTotal])

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

  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setDeliveryOption('store') // Reseta para "Pickup from Store"
    setDeliveryFee(0) // Reseta a taxa de entrega
  }

  const handleDeliveryOptionChange = option => {
    setDeliveryOption(option) // Atualiza a opção de entrega

    if (option === 'delivery') {
      setDeliveryFee(10) // Define a taxa de entrega para R$10
    } else {
      setDeliveryFee(0) // Não há taxa de entrega para retirada na loja
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

    const lineItems = cartItems.map(item => ({
      produtoId: item.produtoId,
      Nome: item.Nome,
      Descricao: item.Descricao,
      quantity: productQuantities[item.produtoId],
      price: item.Preco,
    }))

    try {
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: lineItems,
          deliveryFee, // Opção de entrega (store ou delivery)
          userAddress: enderecoUsuario, // Endereço do usuário (se aplicável)
        }),
      })

      const data = await response.json()
      if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) throw error
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
      // Sum up the prices of all items in the cart
      const precoBase = cartItems.reduce((total, item) => total + item.Preco, 0)

      // Example of updating a state with the calculated price
      setProduto(prevProduto => ({
        ...prevProduto,
        PrecoComEntrega: precoBase, // Define the price
      }))

      setIsModalOpen(true) // Open the modal for confirmation
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

  const handleConfirmPurchase = async () => {
    console.log('Redirecionando para o Stripe...')
    await criarCheckoutSession() // Proceed to checkout session
    setIsModalOpen(false)
  }

  return (
    <div>
      <div className="Menu">
          <header className={styles.menu}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="Logo" />
            </div>
            <nav className={styles.nav}>
              <ul className={styles.navList}>
                <div className={styles.searchBar}>
                  <div className={styles.imgLupa}>
                    <img src="/lupa.png" alt="Logo" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className={'styles.Agenda'}>
                  <li className={styles.navItem}>
                    <button
                      className={styles.cartButton}
                      onClick={handleSchedulingClick}
                    >
                      <img src="/agenda.png" alt="Logo" />
                    </button>
                  </li>
                </div>
                <li className={styles.navItem}>
                  <button onClick={handleCartClick}>
                    <img src="/carrinho.png" alt="Logo" />
                  </button>
                </li>
              </ul>
              {!currentUser && (
                <a href="/Autenticacao/login">
                  <button className={styles.button}>Fazer Login</button>
                </a>
              )}
              {currentUser && (
                <button className={styles.button} onClick={handleLogout}>
                  Logout
                </button>
              )}
            </nav>
          </header>
        </div>
      <div className={styles.title}>Meu Carrinho</div>
      {cartItems.length === 0 ? (
        <div className={styles.subtitulo}>
          <p>Seu carrinho está vazio.</p>
        </div>
      ) : (
      <div className={styles.produto}>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              <img
                src={item.Imagem || 'default-image-url'} // Verifique se a imagem está correta
                alt={item.Nome}
                style={{ width: '100px', height: '100px' }}
              />
                <p>
                  {item.Nome} - R${item.Preco}
                </p>
              <p>Quantidade: {productQuantities[item.produtoId]}</p>
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
      </div>
      )}
      <>
        <div className={styles.valor}>
          <h3>Total: R${totalPrice.toFixed(2)}</h3>
          <button onClick={handleBuy}>Comprar</button>
        </div>
      </>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Confirmar Endereço"
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fundo escuro transparente
            display: 'flex', // Alinha centralmente
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          },
          content: {
            width: '400px',
            maxWidth: '90%',
            maxHeight: '50%',
            overflowY: 'auto', // Para permitir rolagem caso necessário
            margin: '0 auto',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: 'none',
            backgroundColor: '#fff',
            animation: 'fadeIn 0.3s ease-in-out',
          },
        }}
      >
        <div className={style.title}><p>Endereço: {enderecoUsuario || 'Endereço não encontrado'}</p></div>
        <select onChange={e => handleDeliveryOptionChange(e.target.value)} 
            className={style.modalSelect}
          >
          <option value="store">Pegar na loja</option>
          <option value="delivery">Entrega em casa (+ R$ 10,00)</option>
        </select>
        {cartItems.length > 0 && (
          <>
            <div className={style.valor}>Valor: R${totalPrice.toFixed(2)}</div>
          </>
        )}
        <button onClick={handleConfirmPurchase} className={style.btn}>Confirmar</button>
      </Modal>
      <ToastContainer />
    </div>
  )
}

export default Cart
