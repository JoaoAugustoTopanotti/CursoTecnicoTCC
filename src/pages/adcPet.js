import React, { useState, useEffect } from 'react'
import { db } from '../components/firebaseConfig'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { TextField, Button, MenuItem } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

function AdicionarPet() {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [pelagem, setPelagem] = useState('')
  const [peso, setPeso] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [ultimaVacinacao, setUltimaVacinacao] = useState(null)
  const [proximaVacinacao, setProximaVacinacao] = useState(null)
  const [usuarioID, setUsuarioID] = useState('')
  const [valorBanho, setValorBanho] = useState('')
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    const fetchUsuarios = async () => {
      const usuariosRef = collection(db, 'Usuario')
      const usuariosSnap = await getDocs(usuariosRef)
      const usuariosList = usuariosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsuarios(usuariosList)
    }

    fetchUsuarios()
  }, [])

  const handleAdicionarPet = async () => {
    if (
      nome &&
      idade &&
      pelagem &&
      peso &&
      tamanho &&
      usuarioID &&
      valorBanho
    ) {
      try {
        await addDoc(collection(db, 'Pets'), {
          Nome: nome,
          Idade: Number.parseInt(idade),
          Pelagem: pelagem,
          Peso: Number.parseFloat(peso),
          Tamanho: tamanho,
          ÚltimaVacinação: ultimaVacinacao ? new Date(ultimaVacinacao) : null,
          PróximaVacinação: proximaVacinacao
            ? new Date(proximaVacinacao)
            : null,
          UsuarioID: usuarioID,
          ValorBanho: Number.parseFloat(valorBanho),
        })
        alert('Pet adicionado com sucesso!')
        // Limpar os campos após adicionar o pet
        setNome('')
        setIdade('')
        setPelagem('')
        setPeso('')
        setTamanho('')
        setUltimaVacinacao(null)
        setProximaVacinacao(null)
        setUsuarioID('')
        setValorBanho('')
      } catch (error) {
        console.error('Erro ao adicionar pet:', error)
        alert('Erro ao adicionar pet. Tente novamente.')
      }
    } else {
      alert('Preencha todos os campos obrigatórios.')
    }
  }

  return (
    <div>
      <h1>Adicionar Pet Banho e Tosa</h1>
      <form noValidate>
        <TextField
          label="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Idade"
          type="number"
          value={idade}
          onChange={e => setIdade(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Pelagem"
          select
          value={pelagem}
          onChange={e => setPelagem(e.target.value)}
          required
          fullWidth
          margin="normal"
        >
          <MenuItem value="Pequeno">Pequeno</MenuItem>
          <MenuItem value="Médio">Médio</MenuItem>
          <MenuItem value="Grande">Grande</MenuItem>
        </TextField>
        <TextField
          label="Peso (kg)"
          type="number"
          value={peso}
          onChange={e => setPeso(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Tamanho"
          select
          value={tamanho}
          onChange={e => setTamanho(e.target.value)}
          required
          fullWidth
          margin="normal"
        >
          <MenuItem value="Pequeno">Pequeno</MenuItem>
          <MenuItem value="Médio">Médio</MenuItem>
          <MenuItem value="Grande">Grande</MenuItem>
        </TextField>
        <TextField
          label="Última Vacinação"
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          value={ultimaVacinacao || ''}
          onChange={e => setUltimaVacinacao(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Próxima Vacinação"
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          value={proximaVacinacao || ''}
          onChange={e => setProximaVacinacao(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Autocomplete
          options={usuarios}
          getOptionLabel={option => option.login || option.email}
          onChange={(event, newValue) =>
            setUsuarioID(newValue ? newValue.id : '')
          }
          renderInput={params => (
            <TextField {...params} label="Usuário" fullWidth margin="normal" />
          )}
        />
        <TextField
          label="Valor do Banho"
          type="number"
          value={valorBanho}
          onChange={e => setValorBanho(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdicionarPet}
          fullWidth
          style={{ marginTop: '16px' }}
        >
          Adicionar Pet
        </Button>
      </form>
    </div>
  )
}

export default AdicionarPet
