import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import Modal from 'react-modal'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { db } from '../../components/firebaseConfig'
import { adicionarAoCarrinho } from '../../components/carrinhoUtils'
import Header from '../../components/Header'
import { useEnderecoUsuario } from '../../hooks/useEnderecoUsuario'
import { iniciarCheckout } from '../../utils/checkout'
import { notificarSucesso, notificarErro } from '../../utils/notificacoes'
import { TAXA_ENTREGA } from '../../constants'
import modalStyles from '../modalStyles.module.css'
import styles from './produtos.module.css'

const OPCAO_ENTREGA = 'entrega'

const estiloModal = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '400px',
    maxWidth: '90%',
    maxHeight: '50%',
    overflowY: 'auto',
    margin: '0 auto',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: 'none',
    backgroundColor: '#fff',
    animation: 'fadeIn 0.3s ease-in-out',
  },
}

const Produto = () => {
  const router = useRouter()
  const { id } = router.query
  const endereco = useEnderecoUsuario()
  const [produto, setProduto] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [quantidade, setQuantidade] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    if (!id) return

    const buscarProduto = async () => {
      try {
        const produtoSnap = await getDoc(doc(db, 'Produtos', id))
        if (produtoSnap.exists()) {
          setProduto(produtoSnap.data())
        }
      } catch (error) {
        notificarErro('Não foi possível carregar o produto.')
        console.error('Erro ao buscar produto:', error)
      } finally {
        setCarregando(false)
      }
    }

    buscarProduto()
  }, [id])

  if (carregando) {
    return <p>Carregando produto...</p>
  }

  if (!produto) {
    return <p>Produto não encontrado</p>
  }

  const aoAdicionarAoCarrinho = async () => {
    try {
      await adicionarAoCarrinho(id, { ...produto, quantity: quantidade })
      notificarSucesso('Produto adicionado ao carrinho')
    } catch (error) {
      notificarErro('Erro ao adicionar produto ao carrinho')
      console.error('Erro ao adicionar ao carrinho:', error)
    }
  }

  const comprarAgora = () => {
    const precoBase = parseFloat(produto.Preco) * quantidade
    setProduto(anterior => ({ ...anterior, PrecoComEntrega: precoBase }))
    setModalAberto(true)
  }

  const atualizarPrecoEntrega = evento => {
    const precoBase = parseFloat(produto.Preco) * quantidade
    const comEntrega = evento.target.value === OPCAO_ENTREGA
    setProduto(anterior => ({
      ...anterior,
      PrecoComEntrega: comEntrega ? precoBase + TAXA_ENTREGA : precoBase,
    }))
  }

  const confirmarCompra = async () => {
    const precoBase = parseFloat(produto.Preco)
    const precoComEntrega = produto.PrecoComEntrega || precoBase
    const precoUnitario = precoComEntrega ? precoComEntrega / quantidade : precoBase

    await iniciarCheckout({
      cartItems: [
        {
          produtoId: id,
          Nome: produto.Nome,
          Descricao: produto.Descricao,
          price: precoUnitario,
          quantity: quantidade,
        },
      ],
    })

    setModalAberto(false)
  }

  return (
    <div>
      <Header />

      <div className={styles.produto}>
        <div className={styles.titleProdutos}>
          <h3>{produto.Nome}</h3>
        </div>
        <div className={styles.Produto}>
          <div className={styles.imgProdutos}>
            <img src={produto.Imagem} alt={produto.Nome} style={{ maxWidth: '400px' }} />
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
            value={quantidade}
            min="1"
            max={produto.Quantidade}
            onChange={e => setQuantidade(e.target.value)}
          />
          <div className={styles.botao}>
            <button type="button" onClick={aoAdicionarAoCarrinho}>
              Adicionar ao Carrinho
            </button>
            <button type="button" onClick={comprarAgora}>
              Finalizar a Sua Compra
            </button>
          </div>
        </div>
        <div className={styles.descrição}>
          <p>
            {'Informações: '}
            {produto.Descricao || 'Nenhuma descrição disponível'}
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalAberto}
        onRequestClose={() => setModalAberto(false)}
        contentLabel="Confirmar Endereço"
        ariaHideApp={false}
        style={estiloModal}
      >
        <h2 className={modalStyles.modalTitle}>Confirmar Endereço</h2>
        <p className={modalStyles.modalText}>
          <strong>Endereço:</strong> {endereco || 'Endereço não encontrado'}
        </p>

        <label htmlFor="selecioneServico" className={modalStyles.modalLabel}>
          Selecione o Serviço:
        </label>
        <select
          id="selecioneServico"
          onChange={atualizarPrecoEntrega}
          className={modalStyles.modalSelect}
        >
          <option value="buscar_na_loja">Buscar na Loja</option>
          <option value={OPCAO_ENTREGA}>Entrega (+ R$ {TAXA_ENTREGA},00)</option>
        </select>

        <p className={modalStyles.modalPrice}>
          <strong>Preço final:</strong>{' '}
          {produto.PrecoComEntrega
            ? `R$ ${produto.PrecoComEntrega.toFixed(2)}`
            : `R$ ${produto.Preco.toFixed(2)}`}
        </p>

        <div className={modalStyles.modalActions}>
          <button className={modalStyles.modalBtnConfirm} onClick={confirmarCompra}>
            Confirmar
          </button>
          <button className={modalStyles.modalBtnCancel} onClick={() => setModalAberto(false)}>
            Retornar
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  )
}

export default Produto
