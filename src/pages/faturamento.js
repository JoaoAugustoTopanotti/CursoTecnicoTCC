import React, { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'
import styles from './Faturamento.module.css' // Crie e ajuste o arquivo CSS

// Componente Faturamento
const Faturamento = () => {
  const [receitas, setReceitas] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [loading, setLoading] = useState(true)

  // Função para buscar as receitas (soma do campo ValorTotal da coleção Vendas + Valor dos agendamentos finalizados)
  const fetchReceitas = async () => {
    let totalReceitas = 0
    try {
      // Somar os valores da coleção Vendas
      const vendasSnapshot = await getDocs(collection(db, 'Vendas'))
      vendasSnapshot.forEach(docSnap => {
        const venda = docSnap.data()
        totalReceitas += venda.ValorTotal || 0 // Verifica se o campo existe
      })

      // Somar os valores da coleção Agendamentos para agendamentos finalizados
      const agendamentosQuery = query(
        collection(db, 'Agendamentos'),
        where('Status', '==', 'Finalizado')
      )
      const agendamentosSnapshot = await getDocs(agendamentosQuery)
      agendamentosSnapshot.forEach(docSnap => {
        const agendamento = docSnap.data()
        totalReceitas += agendamento.Valor || 0 // Verifica se o campo existe
      })

      setReceitas(totalReceitas)
    } catch (error) {
      console.error('Erro ao buscar receitas:', error)
    }
  }

  // Função para buscar as despesas (salários + bonificação dos vendedores)
  const fetchDespesas = async () => {
    let totalDespesas = 0
    try {
      const vendedoresSnapshot = await getDocs(collection(db, 'Vendedor'))
      vendedoresSnapshot.forEach(docSnap => {
        const vendedor = docSnap.data()
        const salario = vendedor.Salario || 0
        const bonificacao = (vendedor.VendasMes || 0) * 20 // Bonificação de 20 reais por venda
        totalDespesas += salario + bonificacao
      })
      setDespesas(totalDespesas)
    } catch (error) {
      console.error('Erro ao buscar despesas:', error)
    }
  }

  // useEffect para buscar receitas e despesas ao carregar a página
  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      await fetchReceitas()
      await fetchDespesas()
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className={styles.faturamento}>
      <h1>Faturamento</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <h2>Receitas</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Total de Receitas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{`R$ ${receitas.toFixed(2)}`}</td>
              </tr>
            </tbody>
          </table>

          <h2>Despesas</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Total de Despesas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{`R$ ${despesas.toFixed(2)}`}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export default Faturamento
