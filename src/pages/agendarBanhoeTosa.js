import React, { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import { useAuth } from '../components/authContext'
import emailjs from 'emailjs-com'
import { TextField, Button, MenuItem } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

function Agendamento() {
  const [usuarios, setUsuarios] = useState([]) // Lista de usuários
  const [selectedUser, setSelectedUser] = useState(null) // Usuário selecionado
  const [pets, setPets] = useState([]) // Lista de pets do usuário
  const [selectedPets, setSelectedPets] = useState([])
  const [selectedServices, setSelectedServices] = useState({})
  const [dataHora, setDataHora] = useState('')
  const [totalValue, setTotalValue] = useState(0)
  const [error, setError] = useState('')
  const { currentUser } = useAuth()
  const router = useRouter()

  // Carrega todos os usuários para seleção
  useEffect(() => {
    const fetchUsuarios = async () => {
      const querySnapshot = await getDocs(collection(db, 'Usuario'))
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsuarios(usersList)
    }

    fetchUsuarios()
  }, [])

  // Carrega pets do usuário selecionado
  useEffect(() => {
    const fetchPets = async () => {
      if (selectedUser) {
        const q = query(
          collection(db, 'Pets'),
          where('UsuarioID', '==', selectedUser.id)
        )
        const querySnapshot = await getDocs(q)
        const petList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPets(petList)
      }
    }

    fetchPets()
  }, [selectedUser])

  const handleUserSelection = (event, newValue) => {
    setSelectedUser(newValue)
    setSelectedPets([]) // Limpa os pets selecionados ao trocar de usuário
    setTotalValue(0) // Reseta o valor total
  }

  const handlePetSelection = petId => {
    setSelectedPets(prev => {
      if (prev.includes(petId)) {
        return prev.filter(id => id !== petId)
      } else {
        return [...prev, petId]
      }
    })
  }

  const handleServiceChange = (petId, service) => {
    setSelectedServices(prev => ({
      ...prev,
      [petId]: service,
    }))
  }

  useEffect(() => {
    const calculateTotalValue = async () => {
      let calculatedTotalValue = 0

      for (let petId of selectedPets) {
        const petDoc = await getDoc(doc(db, 'Pets', petId))
        const petData = petDoc.data()
        const petValue = petData.ValorBanho
        const service = selectedServices[petId]

        if (service === 'banho_e_tosa_completo') {
          calculatedTotalValue += petValue + 20
        } else {
          calculatedTotalValue += petValue
        }
      }

      setTotalValue(calculatedTotalValue)
    }

    calculateTotalValue()
  }, [selectedPets, selectedServices])

  const handleSubmit = async e => {
    e.preventDefault()

    const selectedDate = new Date(dataHora)
    const currentDate = new Date()

    if (selectedPets.length === 0 || !dataHora) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    if (selectedDate <= currentDate) {
      setError('A data do agendamento deve ser posterior a hoje.')
      return
    }

    try {
      let petNames = []

      for (let petId of selectedPets) {
        const petDoc = await getDoc(doc(db, 'Pets', petId))
        const petData = petDoc.data()
        const service = selectedServices[petId]
        const petValue = petData.ValorBanho

        petNames.push(petData?.Nome || 'Nome não disponível')

        await addDoc(collection(db, 'Agendamentos'), {
          DataHora: selectedDate,
          PetID: petId,
          TipoPelagem: petData?.Pelagem || '',
          UsuarioID: selectedUser.id,
          Valor: service === 'banho_e_tosa_completo' ? petValue + 20 : petValue,
          Status: 'Pendente',
        })
      }

      const templateParams = {
        to_email: selectedUser.Email,
        user_name: selectedUser.Login || selectedUser.Email,
        appointment_date: selectedDate.toLocaleString(),
        pet_name: petNames.join(', '),
        price: totalValue.toFixed(2),
      }

      await emailjs.send(
        'service_7xoagkl',
        'template_h32yvo8',
        templateParams,
        'MBiM7SIBygzCqO4sU'
      )

      alert('Agendamento realizado com sucesso!')
      router.push('/')
    } catch (err) {
      setError('Erro ao realizar o agendamento. Tente novamente.')
      console.error('Erro ao realizar o agendamento: ', err)
    }
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60000
    const localISOTime = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16)
    return localISOTime
  }

  if (!currentUser) {
    return <div>Você precisa estar logado para agendar um banho e tosa.</div>
  }

  return (
    <div>
      <h2>Agendar Banho e Tosa</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Seleção de Usuário */}
      <Autocomplete
        options={usuarios}
        getOptionLabel={option => option.Nome || option.Email}
        onChange={handleUserSelection}
        renderInput={params => (
          <TextField
            {...params}
            label="Selecione o Usuário"
            fullWidth
            margin="normal"
          />
        )}
      />

      {/* Formulário de Agendamento, exibido apenas se um usuário estiver selecionado */}
      {selectedUser && (
        <form onSubmit={handleSubmit}>
          {pets.map(pet => (
            <div key={pet.id} style={{ marginBottom: '20px' }}>
              <label style={{ marginRight: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedPets.includes(pet.id)}
                  onChange={() => handlePetSelection(pet.id)}
                />
                {pet.Nome}
              </label>
              {selectedPets.includes(pet.id) && (
                <label style={{ marginLeft: '10px' }}>
                  Selecione o Serviço:
                  <select
                    onChange={e => handleServiceChange(pet.id, e.target.value)}
                  >
                    <option value="apenas_banho">Apenas Banho</option>
                    <option value="banho_e_tosa_completo">
                      Banho e Tosa Completo (+ R$ 20,00)
                    </option>
                  </select>
                </label>
              )}
              <br />
            </div>
          ))}
          <label>
            Data e Hora:
            <input
              type="datetime-local"
              value={dataHora}
              min={getCurrentDateTime()}
              onChange={e => setDataHora(e.target.value)}
            />
          </label>
          <br />
          <Button variant="contained" color="primary" type="submit">
            Confirmar Agendamento
          </Button>
        </form>
      )}
      <p>Valor total: R$ {totalValue.toFixed(2)}</p>
    </div>
  )
}

export default Agendamento
