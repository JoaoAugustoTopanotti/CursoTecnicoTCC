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
import styles from './agendamento.module.css'

function Agendamento() {
  const [pets, setPets] = useState([])
  const [selectedPets, setSelectedPets] = useState([])
  const [selectedServices, setSelectedServices] = useState({})
  const [dataHora, setDataHora] = useState('')
  const [totalValue, setTotalValue] = useState(0)
  const [error, setError] = useState('')
  const { currentUser, logout } = useAuth()
  const [petNotifications, setPetNotifications] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchPetData = async () => {
      if (currentUser) {
        const q = query(
          collection(db, 'Pets'),
          where('UsuarioID', '==', currentUser.uid)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const notifications = []

          querySnapshot.forEach(doc => {
            const petData = doc.data()
            const nextVaccinationDate = petData.PróximaVacinação.toDate()
            const today = new Date()
            const timeDiff = nextVaccinationDate - today
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

            let color = ''
            if (daysDiff <= 10) {
              color = 'red'
            } else if (daysDiff > 10 && daysDiff <= 20) {
              color = 'yellow'
            } else {
              color = 'green'
            }

            notifications.push({
              petName: petData.Nome,
              daysUntilVaccination: daysDiff,
              color,
            })
          })

          setPetNotifications(notifications)
        }
      }
    }

    const fetchProducts = async () => {
      const q = query(collection(db, 'Produtos'))
      const querySnapshot = await getDocs(q)

      const productsList = []
      querySnapshot.forEach(doc => {
        const productData = doc.data()
        productsList.push({
          id: doc.id,
          nome: productData.Nome,
          descricao: productData.Descrição,
          quantidade: productData.Quantidade,
          imagem: productData.Imagem,
          preco: productData.Preco,
        })
      })

      setProducts(productsList)
    }

    fetchPetData()
    fetchProducts()
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await logout()
      clearNotifications()
      console.log('Usuário deslogado com sucesso.')
      router.push('/')
    } catch (error) {
      console.error('Erro ao deslogar:', error)
    }
  }

  const clearNotifications = () => {
    setPetNotifications([])
  }

  const handleSchedulingClick = () => {
    if (currentUser) {
      router.push('/agendamento')
    } else {
      router.push('Autenticacao/login')
    }
  }
  const handleCartClick = () => {
    if (currentUser) {
      router.push('/cart')
    } else {
      router.push('Autenticacao/login')
    }
  }

  const handleProductClick = productId => {
    if (currentUser) {
      router.push(`/produtos/${productId}`)
    } else {
      router.push('Autenticacao/login')
    }
  }

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    if (!currentUser) {
      router.push('/login')
    }
  }, [currentUser, router])

  useEffect(() => {
    const fetchPets = async () => {
      if (currentUser) {
        const q = query(
          collection(db, 'Pets'),
          where('UsuarioID', '==', currentUser.uid)
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
  }, [currentUser])

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
          UsuarioID: currentUser.uid,
          Valor: service === 'banho_e_tosa_completo' ? petValue + 20 : petValue,
          Status: 'Pendente',
        })
      }

      const templateParams = {
        to_email: currentUser.email,
        user_name: currentUser.displayName || currentUser.email,
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
    <div className={styles.container}>
      <div className="Menu">
        <header className={styles.menu}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Logo" />
          </div>
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              <div className={styles.searchBar}>
                <div className={styles.imgLupa}>
                  <img src="/lupa.png" alt="Logo" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={'styles.Agenda'}>
                <li className={styles.navItem}>
                  <button
                    className={styles.cartButton}
                    onClick={handleSchedulingClick}
                  >
                    <img src="/agenda.png" alt="Logo" />
                  </button>
                </li>
              </div>
              <li className={styles.navItem}>
                <button onClick={handleCartClick}>
                  <img src="/carrinho.png" alt="Logo" />
                </button>
              </li>
            </ul>
            {!currentUser && (
              <a href="/Autenticacao/login">
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
      <div className={styles.agenda}>
        <h2 className={styles.title}>Agendar Banho e Tosa</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          {pets.map(pet => (
            <div key={pet.id} className={styles.petItem}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedPets.includes(pet.id)}
                  onChange={() => handlePetSelection(pet.id)}
                  className={styles.checkbox}
                />
                <span className={styles.petName}>{pet.Nome}</span>
              </label>
              {selectedPets.includes(pet.id) && (
                <select
                  onChange={e => handleServiceChange(pet.id, e.target.value)}
                  className={styles.serviceSelect}
                >
                  <option value="apenas_banho">Apenas Banho</option>
                  <option value="banho_e_tosa_completo">
                    Banho e Tosa Completo (+ R$ 20,00)
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
              min={getCurrentDateTime()}
              onChange={e => setDataHora(e.target.value)}
              className={styles.dateTimeInput}
            />
          </label>
          <p className={styles.totalValue}>
            Valor total: R$ {totalValue.toFixed(2)}
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
