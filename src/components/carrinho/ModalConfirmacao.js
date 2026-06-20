// Modal de confirmação de compra do carrinho (endereço + opção de entrega).
// Extraído do antigo "God Component" cart.js.

import React from 'react'
import Modal from 'react-modal'
import style from '../../pages/Modal.module.css'
import { TAXA_ENTREGA } from '../../constants'

const OPCAO_ENTREGA = { LOJA: 'store', ENTREGA: 'delivery' }

const estiloModal = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
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

export default function ModalConfirmacao({
  aberto,
  aoFechar,
  endereco,
  total,
  temItens,
  aoMudarEntrega,
  aoConfirmar,
}) {
  return (
    <Modal
      isOpen={aberto}
      onRequestClose={aoFechar}
      contentLabel="Confirmar Endereço"
      ariaHideApp={false}
      style={estiloModal}
    >
      <div className={style.title}>
        <p>Endereço: {endereco || 'Endereço não encontrado'}</p>
      </div>
      <select
        onChange={e => aoMudarEntrega(e.target.value)}
        className={style.modalSelect}
      >
        <option value={OPCAO_ENTREGA.LOJA}>Pegar na loja</option>
        <option value={OPCAO_ENTREGA.ENTREGA}>
          Entrega em casa (+ R$ {TAXA_ENTREGA},00)
        </option>
      </select>
      {temItens && <div className={style.valor}>Valor: R${total.toFixed(2)}</div>}
      <button onClick={aoConfirmar} className={style.btn}>
        Confirmar
      </button>
    </Modal>
  )
}

export { OPCAO_ENTREGA }
