// Cabeçalho reutilizável (logo + busca + agenda + carrinho + login/logout).
// Antes esse mesmo bloco estava copiado em cart.js, index.js, agendamento.js e
// produtos/[id].js — agora existe um único componente.

import React, { useState } from 'react'
import { useAuth } from './authContext'
import { useNavegacao } from '../hooks/useNavegacao'
import { ROTAS } from '../constants'
import styles from './Header.module.css'

export default function Header({ termoBusca, aoBuscar }) {
  const { currentUser, logout } = useAuth()
  const { irParaHome, irParaAgendamento, irParaCarrinho } = useNavegacao()

  const handleLogout = async () => {
    await logout()
    irParaHome()
  }

  // Permite usar o cabeçalho mesmo em páginas que não controlam a busca.
  const [buscaLocal, setBuscaLocal] = useState('')
  const valorBusca = termoBusca ?? buscaLocal
  const handleBusca = aoBuscar ?? setBuscaLocal

  return (
    <div className="Menu">
      <header className={styles.menu}>
        <button className={styles.btnlogo} onClick={irParaHome}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Logo" />
          </div>
        </button>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <div className={styles.searchBar}>
              <div className={styles.imgLupa}>
                <img src="/lupa.png" alt="Buscar" />
              </div>
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={valorBusca}
                onChange={e => handleBusca(e.target.value)}
              />
            </div>
            <li className={styles.navItem}>
              <button className={styles.cartButton} onClick={irParaAgendamento}>
                <img src="/agenda.png" alt="Agenda" />
              </button>
            </li>
            <li className={styles.navItem}>
              <button onClick={irParaCarrinho}>
                <img src="/carrinho.png" alt="Carrinho" />
              </button>
            </li>
          </ul>
          {!currentUser && (
            <a href={ROTAS.LOGIN}>
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
  )
}
