import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../components/firebaseConfig'
import { adicionarAoCarrinho } from '../../components/carrinhoUtils'
import { useAuth } from '../../components/authContext'
import { ToastContainer, toast } from 'react-toastify'
import Modal from 'react-modal'
import styles from '../modalStyles.module.css'
import 'react-toastify/dist/ReactToastify.css'

const Produto = () => {
  const router = useRouter()
  const { id } = router.query // Pega o ID da URL
  const [produto, setProduto] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [quantity, setquantity] = useState(1) // Adicionar estado para quantity
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [enderecoUsuario, setEnderecoUsuario] = useState('')
  const { currentUser, logout } = useAuth()

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
      <h1>{produto.Nome}</h1>
      <img
        src={produto.Imagem}
        alt={produto.Nome}
        style={{ maxWidth: '300px' }}
      />
      <p>Preço: R${produto.Preco}</p>
      <p>Quantidade em estoque: {produto.Quantidade}</p>
      <p>
        Descrição:{' '}
        {produto.Descricao ? produto.Descricao : 'Nenhuma descrição disponível'}
      </p>

      <label htmlFor="quantity">Quantidade:</label>
      <input
        type="number"
        id="quantity"
        value={quantity}
        min="1"
        max={produto.Quantidade}
        onChange={e => setquantity(e.target.value)}
      />

      <button type="button" onClick={handleAdicionarAoCarrinho}>
        Adicionar ao Carrinho
      </button>
      <button type="button" onClick={handleComprarAgora}>
        Comprar Agora
      </button>
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
        <h2 className={styles.modalTitle}>Confirmar Endereço</h2>
        <p className={styles.modalText}>
          <strong>Endereço:</strong>{' '}
          {enderecoUsuario || 'Endereço não encontrado'}
        </p>

        <label htmlFor="selecioneServico" className={styles.modalLabel}>
          Selecione o Serviço:
        </label>
        <select
          id="selecioneServico"
          onChange={e => atualizarPreco(e)}
          className={styles.modalSelect}
        >
          <option value="buscar_na_loja">Buscar na Loja</option>
          <option value="entrega">Entrega (+ R$ 10,00)</option>
        </select>

        <p className={styles.modalPrice}>
          <strong>Preço final:</strong>{' '}
          {produto.PrecoComEntrega
            ? `R$ ${produto.PrecoComEntrega.toFixed(2)}`
            : `R$ ${produto.Preco.toFixed(2)}`}
        </p>

        <div className={styles.modalActions}>
          <button
            className={styles.modalBtnConfirm}
            onClick={confirmarEndereco}
          >
            Confirmar Endereço
          </button>
          <button className={styles.modalBtnCancel} onClick={retornar}>
            Retornar
          </button>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  )
}

export default Produto
