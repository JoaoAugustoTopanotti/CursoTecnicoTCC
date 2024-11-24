import React, { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import styles from './Faturamento.module.css' // Crie e ajuste o arquivo CSS

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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

  // Dados para o gráfico de barras
  const data = {
    labels: ['Receitas', 'Despesas'],
    datasets: [
      {
        label: 'Valores',
        data: [receitas, despesas],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  }

  // Opções para o gráfico
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Comparação de Receitas e Despesas',
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `R$ ${tooltipItem.raw.toFixed(2)}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className={styles.faturamento}>
      <div className={styles.titulo}>Faturamento</div>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className={styles.Receita}>Receitas</div>
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

          <div className={styles.Despesas}>Despesas</div>
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

          {/* Gráfico de barras */}
          <div className={styles.grafico}>
            <Bar data={data} options={options} />
          </div>
        </>
      )}
    </div>
  )
}

export default Faturamento
