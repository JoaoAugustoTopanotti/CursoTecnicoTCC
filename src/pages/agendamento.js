import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import emailjs from 'emailjs-com'
import { db } from '../components/firebaseConfig'
import { useAuth } from '../components/authContext'
import Header from '../components/Header'
import { ROTAS, VALOR_TOSA_COMPLETA } from '../constants'
import { notificarSucesso } from '../utils/notificacoes'
import styles from './agendamento.module.css'

// Identificadores públicos do EmailJS (ficam expostos no cliente por natureza).
const EMAILJS = {
  servico: 'service_7xoagkl',
  template: 'template_h32yvo8',
  chavePublica: 'MBiM7SIBygzCqO4sU',
}

const SERVICO_COMPLETO = 'banho_e_tosa_completo'

function Agendamento() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [pets, setPets] = useState([])
  const [petsSelecionados, setPetsSelecionados] = useState([])
  const [servicosSelecionados, setServicosSelecionados] = useState({})
  const [dataHora, setDataHora] = useState('')
  const [valorTotal, setValorTotal] = useState(0)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!currentUser) {
      router.push(ROTAS.LOGIN)
    }
  }, [currentUser, router])

  useEffect(() => {
    if (!currentUser) return

    const buscarPets = async () => {
      const consulta = query(
        collection(db, 'Pets'),
        where('UsuarioID', '==', currentUser.uid)
      )
      const snapshot = await getDocs(consulta)
      setPets(snapshot.docs.map(documento => ({ id: documento.id, ...documento.data() })))
    }

    buscarPets()
  }, [currentUser])

  const alternarPet = petId => {
    setPetsSelecionados(anterior =>
      anterior.includes(petId)
        ? anterior.filter(id => id !== petId)
        : [...anterior, petId]
    )
  }

  const definirServico = (petId, servico) => {
    setServicosSelecionados(anterior => ({ ...anterior, [petId]: servico }))
  }

  const valorDoServico = (valorBanho, servico) =>
    servico === SERVICO_COMPLETO ? valorBanho + VALOR_TOSA_COMPLETA : valorBanho

  useEffect(() => {
    const calcularValorTotal = async () => {
      let total = 0
      for (const petId of petsSelecionados) {
        const petDoc = await getDoc(doc(db, 'Pets', petId))
        total += valorDoServico(petDoc.data().ValorBanho, servicosSelecionados[petId])
      }
      setValorTotal(total)
    }

    calcularValorTotal()
  }, [petsSelecionados, servicosSelecionados])

  const enviarAgendamento = async evento => {
    evento.preventDefault()

    const dataSelecionada = new Date(dataHora)

    if (petsSelecionados.length === 0 || !dataHora) {
      setErro('Por favor, preencha todos os campos.')
      return
    }

    if (dataSelecionada <= new Date()) {
      setErro('A data do agendamento deve ser posterior a hoje.')
      return
    }

    try {
      const nomesPets = []

      for (const petId of petsSelecionados) {
        const petDoc = await getDoc(doc(db, 'Pets', petId))
        const pet = petDoc.data()
        nomesPets.push(pet?.Nome || 'Nome não disponível')

        await addDoc(collection(db, 'Agendamentos'), {
          DataHora: dataSelecionada,
          PetID: petId,
          TipoPelagem: pet?.Pelagem || '',
          UsuarioID: currentUser.uid,
          Valor: valorDoServico(pet.ValorBanho, servicosSelecionados[petId]),
          Status: 'Pendente',
        })
      }

      await emailjs.send(
        EMAILJS.servico,
        EMAILJS.template,
        {
          to_email: currentUser.email,
          user_name: currentUser.displayName || currentUser.email,
          appointment_date: dataSelecionada.toLocaleString(),
          pet_name: nomesPets.join(', '),
          price: valorTotal.toFixed(2),
        },
        EMAILJS.chavePublica
      )

      notificarSucesso('Agendamento realizado com sucesso!')
      router.push(ROTAS.HOME)
    } catch (err) {
      setErro('Erro ao realizar o agendamento. Tente novamente.')
      console.error('Erro ao realizar o agendamento:', err)
    }
  }

  const dataHoraMinima = () => {
    const agora = new Date()
    const fusoEmMs = agora.getTimezoneOffset() * 60000
    return new Date(agora.getTime() - fusoEmMs).toISOString().slice(0, 16)
  }

  if (!currentUser) {
    return <div>Você precisa estar logado para agendar um banho e tosa.</div>
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.agenda}>
        <h2 className={styles.title}>Agendar Banho e Tosa</h2>
        {erro && <p className={styles.errorMessage}>{erro}</p>}

        <form className={styles.form} onSubmit={enviarAgendamento}>
          {pets.map(pet => (
            <div key={pet.id} className={styles.petItem}>
              <label>
                <input
                  type="checkbox"
                  checked={petsSelecionados.includes(pet.id)}
                  onChange={() => alternarPet(pet.id)}
                  className={styles.checkbox}
                />
                <span className={styles.petName}>{pet.Nome}</span>
              </label>
              {petsSelecionados.includes(pet.id) && (
                <select
                  onChange={e => definirServico(pet.id, e.target.value)}
                  className={styles.serviceSelect}
                >
                  <option value="apenas_banho">Apenas Banho</option>
                  <option value={SERVICO_COMPLETO}>
                    Banho e Tosa Completo (+ R$ {VALOR_TOSA_COMPLETA},00)
                  </option>
                </select>
              )}
            </div>
          ))}

          <label>
            Data e Hora:
            <input
              type="datetime-local"
              value={dataHora}
              min={dataHoraMinima()}
              onChange={e => setDataHora(e.target.value)}
              className={styles.dateTimeInput}
            />
          </label>

          <p className={styles.totalValue}>
            Valor total: R$ {valorTotal.toFixed(2)}
          </p>
          <button type="submit" className={styles.submitButton}>
            Confirmar Agendamento
          </button>
        </form>
      </div>
    </div>
  )
}

export default Agendamento
