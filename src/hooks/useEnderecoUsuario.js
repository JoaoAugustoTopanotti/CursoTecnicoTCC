// Busca o endereço cadastrado do usuário logado.
// Usado tanto na página do produto quanto no carrinho.

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { useAuth } from '../components/authContext'

export function useEnderecoUsuario() {
  const { currentUser } = useAuth()
  const [endereco, setEndereco] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) return

    const buscarEndereco = async () => {
      const usuarioSnap = await getDoc(doc(db, 'Usuario', currentUser.uid))
      if (usuarioSnap.exists()) {
        setEndereco(usuarioSnap.data().Endereco)
      }
    }

    buscarEndereco()
  }, [currentUser])

  return endereco
}
