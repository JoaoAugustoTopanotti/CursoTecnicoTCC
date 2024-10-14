// src/pages/FuncionarioBalconista.js
import React from 'react'
import { useRouter } from 'next/router'
import styles from './Gerente.module.css' // Você pode reutilizar o CSS de Gerente

function FuncionarioBalconista() {
  const router = useRouter()

  return (
    <div className={styles.gerenteContainer}>
      <div className={styles.gerenteContent}>
        <h2>Seja Bem-Vindo, Balconista!</h2>
      </div>
      <div className={styles.gerenteMain}>
        <div className={styles.gerenteImage}>
          <img
            src="https://i.pinimg.com/564x/75/34/e2/7534e25d8b7adc635cc1895855cd1c3b.jpg"
            alt="Balconista"
          />
        </div>
        <div className={styles.gerenteButtons}>
          <button onClick={() => router.push('/vendaConsumidor')}>
            Venda ao Consumidor
          </button>
          <button onClick={() => router.push('/adicionarCliente')}>
            Adicionar Cliente
          </button>
        </div>
      </div>
    </div>
  )
}

export default FuncionarioBalconista
