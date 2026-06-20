import React from 'react'
import Header from '../components/Header'
import { useNavegacao } from '../hooks/useNavegacao'
import { useProdutos } from '../hooks/useProdutos'
import { useNotificacoesVacina } from '../hooks/useNotificacoesVacina'
import styles from './index.module.css'

function Home() {
  const { irParaProduto } = useNavegacao()
  const { produtosFiltrados, termoBusca, setTermoBusca } = useProdutos()
  const notificacoesVacina = useNotificacoesVacina()

  return (
    <div className={styles.pagina}>
      <Header termoBusca={termoBusca} aoBuscar={setTermoBusca} />

      <div className={styles.notifications}>
        {notificacoesVacina.map((notificacao, index) => (
          <div
            key={index}
            className={`${styles.notification} ${styles[notificacao.cor]}`}
          >
            Faltam apenas {notificacao.diasParaVacina} dias para{' '}
            {notificacao.nomePet} se vacinar!
          </div>
        ))}
      </div>

      <div className={styles.banner}>
        <img src="/banner.png" alt="Banner" width={1350} />
      </div>

      <div className={styles.title}>
        <h3>Produtos</h3>
      </div>

      <div className={styles.headerRight}>
        <section className={styles.products}>
          <div className={styles.productsList}>
            {produtosFiltrados.map(produto => (
              <div
                key={produto.id}
                className={styles.productItem}
                onClick={() => irParaProduto(produto.id)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className={styles.productImage}
                />
                <h4>{produto.nome}</h4>
                <p>{produto.descricao}</p>
                <p>R$ {produto.preco}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
