// pages/AdcCliente.js
import { useState } from 'react'
import { db } from '../components/firebaseConfig'
import style from './adcCliente.module.css'
import { useRouter } from 'next/router'
import { collection, setDoc, doc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const usersCollectionRef = collection(db, 'Usuario')

// Função para validar CPF
const validarCPF = cpf => {
  cpf = cpf.replace(/[^\d]+/g, '') // Remove caracteres não numéricos
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false // Valida formato e evita CPFs com todos os dígitos iguais

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(9))) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(10))) return false

  return true
}

// Função para formatar o telefone
const formatarTelefone = valor => {
  valor = valor.replace(/\D/g, '') // Remove todos os caracteres não numéricos
  valor = valor.substring(0, 11) // Limita o valor a 11 dígitos (2 para DDD + 9 para número)
  valor = valor.replace(/^(\d{2})(\d)/, '($1) $2') // Adiciona parênteses ao código de área
  valor = valor.replace(/(\d{5})(\d)/, '$1-$2') // Adiciona o hífen após o quinto dígito
  return valor
}

const AdcCliente = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()

  // Função para formatar o CPF
  const formatarCPF = valor => {
    valor = valor.replace(/\D/g, '') // Remove todos os caracteres não numéricos
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o primeiro ponto
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o segundo ponto
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2') // Adiciona o traço
    return valor
  }

  const handleCpfChange = e => {
    const valorFormatado = formatarCPF(e.target.value)
    setCpf(valorFormatado)
  }

  const handleTelefoneChange = e => {
    const valorFormatado = formatarTelefone(e.target.value)
    setTelefone(valorFormatado)
  }

  const handleRegister = async e => {
    e.preventDefault()

    if (!validarCPF(cpf)) {
      setErrorMessage('CPF inválido.')
      return
    }

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

      await setDoc(doc(db, 'Usuario', user.uid), {
        Email: user.email,
        uid: user.uid,
        Nome: nome,
        Endereco: endereco,
        CPF: cpf,
        Telefone: telefone,
        DataNascimento: dataNascimento,
      })

      setErrorMessage('')
      alert('Usuário Cadastrado com Sucesso!')
    } catch (error) {
      setErrorMessage(`Erro ao registrar: ${error.message}`)
    }
  }

  return (
    <div className={style.container}>
      <h1 className={style.titulo}>Adicionar Clientes</h1>
      <input
        className={style.input}
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={e => setNome(e.target.value)}
      />
      <input
        className={style.input}
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Endereço"
        value={endereco}
        onChange={e => setEndereco(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="CPF"
        value={cpf}
        onChange={handleCpfChange}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Telefone"
        value={telefone}
        onChange={handleTelefoneChange}
      />
      <input
        className={style.input}
        type="date"
        placeholder="Data de nascimento"
        value={dataNascimento}
        onChange={e => setDataNascimento(e.target.value)}
      />
      <input
        className={style.input}
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      />
      <input
        className={style.input}
        type="password"
        placeholder="Confirmar Senha"
        value={confirmarSenha}
        onChange={e => setConfirmarSenha(e.target.value)}
      />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button className={style.button} onClick={handleRegister}>
        Criar dado
      </button>
    </div>
  )
}

export default AdcCliente
