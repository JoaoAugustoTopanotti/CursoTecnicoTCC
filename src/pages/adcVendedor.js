import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import style from './adcCliente.module.css'
import { db } from '../components/firebaseConfig'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

export const AdcVendedor = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [funcao, setFuncao] = useState('')
  const [salario, setSalario] = useState(0)
  const [vendasMes, setVendasMes] = useState(0)
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRegister = async e => {
    e.preventDefault()

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas não coincidem.')
      return
    } else if (senha.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 dígitos')
      return
    }

    const auth = getAuth()
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      )
      const user = userCredential.user

      // Adiciona o vendedor com os detalhes fornecidos no Firestore
      await setDoc(doc(db, 'Vendedor', user.uid), {
        Email: user.email,
        uid: user.uid,
        Nome: nome,
        Funcao: funcao,
        Salario: Number(salario),
        VendasMes: Number(vendasMes),
      })

      setErrorMessage('')
      alert('Usuário Cadastrado com Sucesso!')
    } catch (error) {
      setErrorMessage(`Erro ao registrar: ${error.message}`)
    }
  }

  return (
    <div className={style.container}>
      <div className={style.titulo}>Adicionar Vendedor</div>
      <form onSubmit={handleRegister}>
        <div>
          <input
            className={style.input}
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
        </div>
        <div>
          <input
            className={style.input}
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* Select para a função */}
        <div>
          <select
            className={style.input}
            value={funcao}
            onChange={e => setFuncao(e.target.value)}
          >
            <option value="" disabled>
              Selecione a Função
            </option>
            <option value="Banho e Tosa">Banho e Tosa</option>
            <option value="Balconista">Balconista</option>
          </select>
        </div>
        <div>
          <input
            className={style.input}
            type="number"
            placeholder="Salário"
            value={salario}
            onChange={e => setSalario(e.target.value)}
          />
        </div>
        <div>
          <input
            className={style.input}
            type="number"
            placeholder="Vendas no Mês"
            value={vendasMes}
            onChange={e => setVendasMes(e.target.value)}
          />
        </div>
        <div>
          <input
            className={style.input}
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
        </div>
        <div>
          <input
            className={style.input}
            type="password"
            placeholder="Confirmar Senha"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
          />
        </div>

        {/* Exibe mensagem de erro se existir */}
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

        <button className={style.button} type="submit">
          Criar Vendedor
        </button>
      </form>
    </div>
  )
}

export default AdcVendedor
