// Lista de itens do carrinho. Extraído do antigo "God Component" cart.js.

import React from 'react'
import styles from '../../pages/Cart.module.css'

export default function ListaCarrinho({ itens, quantidades, aoAjustar, aoRemover }) {
  if (itens.length === 0) {
    return (
      <div className={styles.subtitulo}>
        <p>Seu carrinho está vazio.</p>
      </div>
    )
  }

  return (
    <div className={styles.produto}>
      <ul>
        {itens.map(item => (
          <li key={item.produtoId}>
            <img
              src={item.Imagem || 'default-image-url'}
              alt={item.Nome}
              style={{ width: '100px', height: '100px' }}
            />
            <p>
              {item.Nome} - R${item.Preco}
            </p>
            <p>Quantidade: {quantidades[item.produtoId]}</p>
            <button
              onClick={() =>
                aoAjustar(item.produtoId, quantidades[item.produtoId] - 1, item.Quantidade)
              }
            >
              -
            </button>
            <button
              onClick={() =>
                aoAjustar(item.produtoId, quantidades[item.produtoId] + 1, item.Quantidade)
              }
            >
              +
            </button>
            <button onClick={() => aoRemover(item.produtoId)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
