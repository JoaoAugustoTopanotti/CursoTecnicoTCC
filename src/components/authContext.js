import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebaseConfig'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null) // Papel do usuário
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setCurrentUser(user)

        // Verifica se o usuário é gerente
        const gerenteDoc = await getDoc(doc(db, 'Gerente', user.uid))
        setRole(gerenteDoc.exists() ? 'manager' : 'user')
      } else {
        setCurrentUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      setRole(null)
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  const value = {
    currentUser,
    role,
    loading,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
