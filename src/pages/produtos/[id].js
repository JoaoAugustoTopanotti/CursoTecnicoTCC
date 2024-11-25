import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../components/firebaseConfig'
import { adicionarAoCarrinho } from '../../components/carrinhoUtils'
import { useAuth } from '../../components/authContext'
import { ToastContainer, toast } from 'react-toastify'
import Modal from 'react-modal'
import modalStyles from '../modalStyles.module.css'
import 'react-toastify/dist/ReactToastify.css'
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './produtos.module.css'

const Produto = () => {
  const router = useRouter()
  const { id } = router.query // Pega o ID da URL
  const [produto, setProduto] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [quantity, setquantity] = useState(1) // Adicionar estado para quantity
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [enderecoUsuario, setEnderecoUsuario] = useState('')
  const { currentUser, logout } = useAuth()
  const [petNotifications, setPetNotifications] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

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
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => {
      console.log('Stripe carregado com sucesso')
    }
    script.onerror = () => {
      console.error('Falha ao carregar o Stripe')
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (id) {
      const buscarProduto = async () => {
        try {
          const produtoRef = doc(db, 'Produtos', id)
          const produtoSnap = await getDoc(produtoRef)

          if (produtoSnap.exists()) {
            setProduto(produtoSnap.data())
            console.log('Produto encontrado:', produtoSnap.data())
          } else {
            console.error('Produto não encontrado')
          }
        } catch (error) {
          console.error('Erro ao buscar produto:', error)
        } finally {
          setCarregando(false)
        }
      }

      buscarProduto()
    }
  }, [id])

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

  if (carregando) {
    return <p>Carregando produto...</p>
  }

  if (!produto) {
    return <p>Produto não encontrado</p>
  }

  const handleAdicionarAoCarrinho = async () => {
    try {
      await adicionarAoCarrinho(id, { ...produto, quantity }) // Passar quantity
      toast.success('Produto adicionado ao carrinho', {
        position: 'top-center',
        autoClose: 2000,
      })
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      toast.error('Erro ao adicionar produto ao carrinho', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

  const handleComprarAgora = () => {
    // Atualiza o preço com base no estado atual
    const precoBase = parseFloat(produto.Preco) * quantity // Sem multiplicar pela quantidade aqui
    setProduto(prevProduto => ({
      ...prevProduto,
      PrecoComEntrega: precoBase, // Define o preço inicial sem entrega
    }))
    setIsModalOpen(true) // Abre o modal de confirmação de endereço
  }

  const atualizarPreco = e => {
    const precoBase = parseFloat(produto.Preco) * quantity // Preço base com a quantidade
    const precoComEntrega = precoBase + 10 // Preço com entrega

    if (e.target.value === 'entrega') {
      // Atualiza o preço com entrega
      setProduto(prevProduto => ({
        ...prevProduto,
        PrecoComEntrega: precoComEntrega,
      }))
    } else {
      // Reseta o preço para o base (sem entrega)
      setProduto(prevProduto => ({
        ...prevProduto,
        PrecoComEntrega: precoBase,
      }))
    }
  }

  const confirmarEndereco = async () => {
    // Aqui, fazemos o cálculo correto
    const precoBase = parseFloat(produto.Preco)
    const precoComEntrega = produto.PrecoComEntrega || precoBase // Se houver entrega, pega o preço com entrega

    // Agora já consideramos a quantidade ao enviar para o Stripe
    console.log(quantity)
    const precoTotal = precoComEntrega ? precoComEntrega / quantity : precoBase

    console.log('Preço final calculado no frontend:', precoTotal)

    try {
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: [
            {
              produtoId: id,
              Nome: produto.Nome,
              Descricao: produto.Descricao,
              price: precoTotal, // Preço total com quantidade aplicada
              quantity: quantity, // Quantidade de produtos
            },
          ],
          endereco: enderecoUsuario,
        }),
      })

      const data = await response.json()
      if (data.sessionId) {
        const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE)
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) {
          console.error('Erro ao redirecionar para o checkout:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao processar a compra:', error)
      toast.error('Erro ao processar a compra', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
    setIsModalOpen(false)
  }
  const retornar = () => {
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
      <div className={styles.produto}>
        <div className={styles.titleProdutos}>
          <h3>{produto.Nome}</h3>
        </div>
        <div className={styles.Produto}>
          <div className={styles.imgProdutos}>
            <img
              src={produto.Imagem}
              alt={produto.Nome}
              style={{ maxWidth: '400px' }}
            />
          </div>
        </div>
        <div className={styles.infoProdutos}>
          <div className={styles.titleProdutos}>
            <p>Valor: R${produto.Preco}</p>
          </div>
          <p>Estoque: {produto.Quantidade}</p>
          <label htmlFor="quantidade">Quantidade:</label>
          <input
            type="number"
            id="quantidade"
            value={quantity}
            min="1"
            max={produto.Quantidade}
            onChange={e => setquantity(e.target.value)}
          />
          <div className={styles.botao}>
            <button type="button" onClick={handleAdicionarAoCarrinho}>
              Adicionar ao Carrinho
            </button>
            <button type="button" onClick={handleComprarAgora}>
              Finalizar a Sua Compra
            </button>
          </div>
        </div>
        <div className={styles.descrição}>
            <p>
              {'Informações: '}
              {produto.Descricao
                ? produto.Descricao
                : 'Nenhuma descrição disponível'}
            </p>
          </div>
      </div>
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
        <h2 className={modalStyles.modalTitle}>Confirmar Endereço</h2>
        <p className={modalStyles.modalText}>
          <strong>Endereço:</strong>{' '}
          {enderecoUsuario || 'Endereço não encontrado'}
        </p>

        <label htmlFor="selecioneServico" className={modalStyles.modalLabel}>
          Selecione o Serviço:
        </label>
        <select
          id="selecioneServico"
          onChange={e => atualizarPreco(e)}
          className={modalStyles.modalSelect}
        >
          <option value="buscar_na_loja">Buscar na Loja</option>
          <option value="entrega">Entrega (+ R$ 10,00)</option>
        </select>

        <p className={modalStyles.modalPrice}>
          <strong>Preço final:</strong>{' '}
          {produto.PrecoComEntrega
            ? `R$ ${produto.PrecoComEntrega.toFixed(2)}`
            : `R$ ${produto.Preco.toFixed(2)}`}
        </p>

        <div className={modalStyles.modalActions}>
          <button
            className={modalStyles.modalBtnConfirm}
            onClick={confirmarEndereco}
          >
            Confirmar
          </button>
          <button className={modalStyles.modalBtnCancel} onClick={retornar}>
            Retornar
          </button>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  )
}

export default Produto
