// src/pages/FuncionarioBanhoTosa.js
import React from 'react'
import { useRouter } from 'next/router'
import styles from './Gerente.module.css' // Você pode reutilizar o CSS de Gerente

function FuncionarioBanhoTosa() {
  const router = useRouter()

  return (
    <div className={styles.gerenteContainer}>
      <div className={styles.gerenteContent}>
        <h2>Seja Bem-Vindo, Banho e Tosa!</h2>
      </div>
      <div className={styles.gerenteMain}>
        <div className={styles.gerenteImage}>
          <img
            src="https://i.pinimg.com/564x/75/34/e2/7534e25d8b7adc635cc1895855cd1c3b.jpg"
            alt="Banho e Tosa"
          />
        </div>
        <div className={styles.gerenteButtons}>
          <button onClick={() => router.push('/adcPet')}>Adicionar Pet</button>
          <button onClick={() => router.push('/visualizarAgenda')}>
            Agenda Banho e Tosa
          </button>
        </div>
      </div>
    </div>
  )
}

export default FuncionarioBanhoTosa
