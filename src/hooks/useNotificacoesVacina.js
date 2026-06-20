// Busca os pets do usuário e devolve as notificações de vacinação.
// Antes, esse mesmo useEffect estava duplicado em 4 páginas.

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { useAuth } from '../components/authContext'
import { montarNotificacoesDeVacina } from '../utils/vacinas'

export function useNotificacoesVacina() {
  const { currentUser } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])

  useEffect(() => {
    if (!currentUser) {
      setNotificacoes([])
      return
    }

    const buscarPets = async () => {
      const consulta = query(
        collection(db, 'Pets'),
        where('UsuarioID', '==', currentUser.uid)
      )
      const snapshot = await getDocs(consulta)
      setNotificacoes(snapshot.empty ? [] : montarNotificacoesDeVacina(snapshot))
    }

    buscarPets()
  }, [currentUser])

  return notificacoes
}
