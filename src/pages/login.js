import React, { useState } from 'react'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/router'
import { db } from '../components/firebaseConfig' // Certifique-se de que o caminho esteja correto
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './Login.module.css' // Verifique se o caminho do CSS está correto

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

      // Verificar se é um gerente
      if (email === 'joaoactopa@gmail.com' && password === '123456') {
        router.push('/gerente')
        console.log('Usuário autenticado (Gerente):', user.uid)
      } else {
        // Verificar se é um vendedor
        const q = query(collection(db, 'Vendedor'), where('Email', '==', email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const vendedorDoc = querySnapshot.docs[0]
          const funcao = vendedorDoc.data().Funcao

          // Redirecionar para a tela de funcionário específica conforme a função
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
          // Se não for nem gerente nem vendedor, redireciona para a página principal
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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
      <p>
        Não tem uma conta? <a href="/register">Registre-se aqui</a>
      </p>
    </div>
  )
}

export default Login
