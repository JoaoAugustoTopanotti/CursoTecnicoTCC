import React, { useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from '../components/Header'
import ListaCarrinho from '../components/carrinho/ListaCarrinho'
import ModalConfirmacao, { OPCAO_ENTREGA } from '../components/carrinho/ModalConfirmacao'
import { useCarrinho } from '../hooks/useCarrinho'
import { iniciarCheckout } from '../utils/checkout'
import { notificarErro } from '../utils/notificacoes'
import { TAXA_ENTREGA } from '../constants'
import styles from './Cart.module.css'

const Cart = () => {
  const {
    itens,
    quantidades,
    endereco,
    ajustarQuantidade,
    removerDoCarrinho,
    calcularSubtotal,
  } = useCarrinho()

  const [modalAberto, setModalAberto] = useState(false)
  const [taxaEntrega, setTaxaEntrega] = useState(0)

  const total = calcularSubtotal() + taxaEntrega

  const mudarOpcaoEntrega = opcao =>
    setTaxaEntrega(opcao === OPCAO_ENTREGA.ENTREGA ? TAXA_ENTREGA : 0)

  const abrirModal = () => {
    if (itens.length === 0) {
      notificarErro('Seu carrinho está vazio. Adicione produtos antes de comprar.')
      return
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setTaxaEntrega(0)
  }

  const confirmarCompra = async () => {
    const itensCheckout = itens.map(item => ({
      produtoId: item.produtoId,
      Nome: item.Nome,
      Descricao: item.Descricao,
      quantity: quantidades[item.produtoId],
      price: item.Preco,
    }))

    await iniciarCheckout({
      cartItems: itensCheckout,
      deliveryFee: taxaEntrega,
      userAddress: endereco,
    })

    setModalAberto(false)
  }

  return (
    <div>
      <Header />
      <div className={styles.title}>Meu Carrinho</div>

      <ListaCarrinho
        itens={itens}
        quantidades={quantidades}
        aoAjustar={ajustarQuantidade}
        aoRemover={removerDoCarrinho}
      />

      <div className={styles.valor}>
        <h3>Total: R${total.toFixed(2)}</h3>
        <button onClick={abrirModal}>Comprar</button>
      </div>

      <ModalConfirmacao
        aberto={modalAberto}
        aoFechar={fecharModal}
        endereco={endereco}
        total={total}
        temItens={itens.length > 0}
        aoMudarEntrega={mudarOpcaoEntrega}
        aoConfirmar={confirmarCompra}
      />

      <ToastContainer />
    </div>
  )
}

export default Cart
