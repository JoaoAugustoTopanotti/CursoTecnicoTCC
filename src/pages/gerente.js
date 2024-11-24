import React, { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'
import styles from './Gerente.module.css'

// Importando os componentes existentes
import VendaConsumidor from './vendaConsumidor'
import AdcCliente from './AdcCliente'
import VisualizarCliente from './VisualizarCliente'
import AdcProduto from './AdcProduto'
import VisualizarProduto from './VisualizarProduto'
import AdcVendedor from './AdcVendedor'
import VisualizarVendedor from './VisualizarVendedor'
import AdcPet from './AdcPet'
import VisualizarAgenda from './VisualizarAgenda'
import Faturamento from './Faturamento'

function Gerente() {
  const [nomeGerente, setNomeGerente] = useState('')
  const [activePage, setActivePage] = useState('home')

  useEffect(() => {
    const fetchGerenteData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Gerente'))
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          setNomeGerente(doc.data().login || '')
        } else {
          console.log('Nenhum documento encontrado na coleção Gerente')
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gerente:', error)
      }
    }

    fetchGerenteData()
  }, [])

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return <div className={styles.lotoTeT}><h2>Bem-vindo, {nomeGerente}!</h2><img src="/logoTeT.png" alt="Logo" width={550}/></div>
      case 'vendaConsumidor':
        return <VendaConsumidor />
      case 'adcCliente':
        return <AdcCliente />
      case 'visualizarCliente':
        return <VisualizarCliente />
      case 'adcProduto':
        return <AdcProduto />
      case 'visualizarProduto':
        return <VisualizarProduto />
      case 'adcVendedor':
        return <AdcVendedor />
      case 'visualizarVendedor':
        return <VisualizarVendedor />
      case 'adcPet':
        return <AdcPet />
      case 'visualizarAgenda':
        return <VisualizarAgenda />
      case 'faturamento':
        return <Faturamento />
      default:
        return (
          <h1>Error 404!, nenhuma página encontrada</h1>
        )
          
    }
  }

  return (
    <div className={styles.gerenteContainer}>
      <aside className={styles.sidebar}>
        <h2>Menu</h2>
        <ul>
          <li onClick={() => setActivePage('vendaConsumidor')}>Venda ao Consumidor</li>
          <li onClick={() => setActivePage('adcCliente')}>Adicionar Cliente</li>
          <li onClick={() => setActivePage('visualizarCliente')}>Visualizar Clientes</li>
          <li onClick={() => setActivePage('adcProduto')}>Adicionar Produto</li>
          <li onClick={() => setActivePage('visualizarProduto')}>Visualizar Produtos</li>
          <li onClick={() => setActivePage('adcVendedor')}>Adicionar Vendedor</li>
          <li onClick={() => setActivePage('visualizarVendedor')}>Visualizar Vendedores</li>
          <li onClick={() => setActivePage('adcPet')}>Adicionar Pet Banho e Tosa</li>
          <li onClick={() => setActivePage('visualizarAgenda')}>Visualizar Agenda</li>
          <li onClick={() => setActivePage('faturamento')}>Faturamento</li>
        </ul>
      </aside>
      <main className={styles.content}>
        {renderContent()}
      </main>
    </div>
  )
}

export default Gerente
