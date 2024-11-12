import React, { useState } from 'react'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/router'
import { db } from '../../components/firebaseConfig'
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './login.module.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const auth = getAuth()

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      if (email === 'joaoactopa@gmail.com' && password === '123456') {
        router.push('/gerente')
        console.log('Usuário autenticado (Gerente):', user.uid)
      } else {
        const q = query(collection(db, 'Vendedor'), where('Email', '==', email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const vendedorDoc = querySnapshot.docs[0]
          const funcao = vendedorDoc.data().Funcao

          if (funcao === 'Balconista') {
            router.push('/funcionarioBalconista')
          } else if (funcao === 'Banho e Tosa') {
            router.push('/funcionarioBanhoTosa')
          }
          console.log(
            `Usuário autenticado (Funcionário - ${funcao}):`,
            user.uid
          )
        } else {
          router.push('/')
          console.log('Usuário autenticado:', user.uid)
        }
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      alert('Erro ao fazer login. Verifique suas informações.')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Login</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className={styles.button}>
            Login
          </button>
        </form>
        <p className={styles.registerLink}>
          Não tem uma conta?{' '}
          <a href="/Autenticacao/register">Registre-se aqui</a>
        </p>
      </div>
    </div>
  )
}

export default Login
