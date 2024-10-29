// src/pages/FuncionarioBanhoTosa.js
import React from 'react'
import { useRouter } from 'next/router'
import styles from './Gerente.module.css' // Você pode reutilizar o CSS de Gerente
import { collection, getDocs } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'

function FuncionarioBanhoTosa() {
  const [nomeFuncionario, setNomeFuncionario] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchVendedorData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Vendedor'))
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          setNomeFuncionario(doc.data().Nome || '')
        } else {
          console.log('Nenhum documento encontrado na coleção Vendedor')
        }
      } catch (error) {
        console.error('Erros ao buscar dados do Vendedor: ', error)
      }
    }

    fetchVendedorData()
  }, [])

  return (
    <div className={styles.gerenteContainer}>
      <div className={styles.gerenteContent}>
        <h2>Seja Bem-Vindo, {nomeFuncionario}!</h2>
      </div>
      <div className={styles.gerenteMain}>
        <div className={styles.gerenteImage}>
          <img
            src="https://levemeaoseulider.wordpress.com/wp-content/uploads/2016/03/d69e0-untitled-bmp.jpg"
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
