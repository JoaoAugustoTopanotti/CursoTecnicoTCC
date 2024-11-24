import React, { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from './Cart.module.css' // Importando o arquivo CSS
import { collection, query, getDocs, where } from 'firebase/firestore'
import { useAuth } from '../components/authContext'
import { useRouter } from 'next/router'

const Cart = () => {
  const [cartItems, setCartItems] = useState([])
  const [productQuantities, setProductQuantities] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
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
          descricao: productData.Descrição,
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

  useEffect(() => {
    const fetchCartItems = async () => {
      if (user && user.uid) {
        try {
          const cartRef = doc(db, 'Carrinho', user.uid)
          const cartSnap = await getDoc(cartRef)

          if (cartSnap.exists()) {
            const { Itens } = cartSnap.data()

            if (Itens && Array.isArray(Itens)) {
              const initialQuantities = {}
              const validItems = Itens.filter(item => {
                if (item.Nome && item.Preco) {
                  initialQuantities[item.produtoId] = 1
                  return true
                }
                return false
              })

              setProductQuantities(initialQuantities)
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

  const ajustarQuantidade = async (produtoId, novaQuantidade, estoqueDisponivel) => {
    if (novaQuantidade <= estoqueDisponivel && novaQuantidade > 0) {
      try {
        setProductQuantities(prevQuantities => ({
          ...prevQuantities,
          [produtoId]: novaQuantidade,
        }))
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.produtoId === produtoId
              ? { ...item, quantidade: novaQuantidade }
              : item
          )
        )

        const cartRef = doc(db, 'Carrinho', user.uid)
        const cartSnap = await getDoc(cartRef)
        if (cartSnap.exists()) {
          const cartData = cartSnap.data()
          const updatedItems = cartData.Itens.map(item =>
            item.produtoId === produtoId
              ? { ...item, quantidade: novaQuantidade }
              : item
          )

          await updateDoc(cartRef, { Itens: updatedItems })
        }
      } catch (error) {
        console.error('Erro ao atualizar a quantidade no banco de dados:', error)
      }
    } else {
      alert('A quantidade selecionada excede o estoque disponível.')
    }
  }

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

  const loadStripe = () => {
    return new Promise(resolve => {
      if (window.Stripe) {
        resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE))
      } else {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.async = true
        script.onload = () => {
          resolve(window.Stripe(process.env.NEXT_PUBLIC_STRIPE))
        }
        script.onerror = () => {
          resolve(null)
        }
        document.body.appendChild(script)
      }
    })
  }

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
        Descricao: item.Descricao,
        quantity,
        price: item.Preco,
      }
    })

    try {
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItems: lineItems, productQuantities }),
      })

      const data = await response.json()

      if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) {
          toast.error('Erro ao processar a compra', {
            position: 'top-center',
            autoClose: 2000,
          })
        }
      }
    } catch (error) {
      toast.error('Erro ao processar a compra', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

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
    <div className={styles.container}>
      <div className="Menu">
          <header className={styles.menu}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="Logo" />
            </div>
            <div className={styles.notifications}>
              {petNotifications.map((notification, index) => (
                <div
                  key={index}
                  className={`${styles.notification} ${styles[notification.color]}`}
                >
                  Faltam apenas {notification.daysUntilVaccination} dias para{' '}
                  {notification.petName} se vacinar!
                </div>
              ))}
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
        <div className={styles.carrinho}>
        <h2 className={styles.h2}>Meu Carrinho</h2>
        {cartItems.length === 0 ? (
          <p className={styles.emptyCart}>Seu carrinho está vazio.</p>
        ) : (
          <ul>
            {cartItems.map((item) => (
              <li key={item.produtoId} className={styles.li}>
                <img className={styles.img} src={item.Imagem} alt={item.Nome} />
                <div>
                  <p className={styles.p}>{item.Nome}</p>
                  <p className={styles.p}>R$ {item.Preco}</p>
                </div>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => ajustarQuantidade(item.produtoId, productQuantities[item.produtoId] - 1, item.Estoque)}
                  >
                    -
                  </button>
                  <span>{productQuantities[item.produtoId]}</span>
                  <button
                    onClick={() => ajustarQuantidade(item.produtoId, productQuantities[item.produtoId] + 1, item.Estoque)}
                  >
                    +
                  </button>
                </div>
                <button
                  className={styles.removeButton}
                  onClick={() => removerDoCarrinho(item.produtoId)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.total}>
          <p>Total: R$ {totalPrice.toFixed(2)}</p>
        </div>
        <button
          className={styles.buyButton}
          onClick={handleBuy}
        >
          Finalizar Compra
        </button>
        <ToastContainer />
      </div>
    </div>
  )
}

export default Cart
