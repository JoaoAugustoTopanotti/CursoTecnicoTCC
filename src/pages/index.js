import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { db } from '../components/firebaseConfig'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { AuthProvider } from '../components/authContext'
import styles from './index.module.css'
import { useAuth } from '../components/authContext'

function Home() {
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

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="https://www.florence.edu.br/wp-content/uploads/2022/08/Imagem-Materia_Dia-do-Cachorro-600x400.png" />
        </div>
        <h2 className={styles.title}>Bem-vindo à Agroshop!</h2>
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
            <li className={styles.navItem}>
              <a href="/">Home</a>
            </li>
            <li className={styles.navItem}>
              <button
                className={styles.cartButton}
                onClick={handleSchedulingClick}
              >
                Agendamento
              </button>
            </li>
            <li className={styles.navItem}>
              <button className={styles.cartButton} onClick={handleCartClick}>
                Carrinho
              </button>
            </li>
          </ul>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
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
      <div className={styles.headerRight}>
        <section className={styles.products}>
          <h3>Produtos Disponíveis</h3>
          <div className={styles.productsList}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={styles.productItem}
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={product.imagem}
                  alt={product.nome}
                  className={styles.productImage}
                />
                <h4>{product.nome}</h4>
                <p>{product.descricao}</p>
                <p>Quantidade: {product.quantidade}</p>
                <p>Preço: R$ {product.preco}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
export default Home
