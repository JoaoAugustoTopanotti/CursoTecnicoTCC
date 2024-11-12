import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from '../../components/firebaseConfig'
import { doc, setDoc } from 'firebase/firestore'
import styles from './register.module.css'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()

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

      await setDoc(doc(db, 'Usuario', user.uid), {
        email: user.email,
        uid: user.uid,
      })

      router.push('/login')
    } catch (error) {
      setErrorMessage(`Erro ao registrar: ${error.message}`)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Registrar</h2>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className={styles.input}
          />
          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
          <button type="submit" className={styles.button}>
            Registrar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
