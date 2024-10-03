import React, { useState } from 'react'
import { useRouter } from 'next/router' // Importa o useRouter do Next.js
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from '../components/firebaseConfig'
import { doc, setDoc } from 'firebase/firestore'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter() // Inicializa o useRouter

  const handleRegister = async e => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.')
      return
    }

    const auth = getAuth()
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Salva o usuário no Firestore
      await setDoc(doc(db, 'Usuario', user.uid), {
        email: user.email,
        uid: user.uid,
      })

      // Redireciona para a página de login
      router.push('/login') // Substitui o navigate por router.push
    } catch (error) {
      setErrorMessage(`Erro ao registrar:   ${error.message}`)
    }
  }

  return (
    <div>
      <h2>Registrar</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <button type="submit">Registrar</button>
      </form>
    </div>
  )
}

export default Register
