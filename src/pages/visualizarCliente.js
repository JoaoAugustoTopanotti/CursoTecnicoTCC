import { db } from '../components/firebaseConfig'
import {
  getFirestore,
  collection,
  doc,
  deleteDoc,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import style from './visualizarCliente.module.css'

export const CrudCliente = () => {
  const [usuarios, setUsuarios] = useState([])
  const [filteredUsuarios, setFilteredUsuarios] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const usuarioCollectionRef = collection(db, 'Usuario')

  useEffect(() => {
    const getUsuarios = async () => {
      const data = await getDocs(usuarioCollectionRef)
      const sortedUsers = data.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .sort((a, b) => a.Nome.localeCompare(b.Nome)) // Ordena os nomes alfabeticamente
      setUsuarios(sortedUsers)
      setFilteredUsuarios(sortedUsers)
    }
    getUsuarios()
  }, [])

  const handleSearch = e => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    const filtered = usuarios.filter(user =>
      user.Nome.toLowerCase().includes(term)
    )
    setFilteredUsuarios(filtered)
  }

  const toggleUserDetails = id => {
    setActiveUserId(activeUserId === id ? null : id)
  }

  async function deleteUser(id) {
    try {
      const userDoc = doc(db, 'Usuario', id)
      await deleteDoc(userDoc)
      alert('Usuário deletado com sucesso!')
      setUsuarios(usuarios.filter(user => user.id !== id))
      setFilteredUsuarios(filteredUsuarios.filter(user => user.id !== id))
    } catch (e) {
      console.error('Erro ao deletar usuário: ', e)
      alert('Erro ao deletar usuário: ' + e.message)
    }
  }

  const startEditUser = user => {
    setEditingUser(user)
    setEditFormData(user)
  }

  const handleEditChange = e => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    })
  }

  const saveEdits = async e => {
    e.preventDefault()
    try {
      const userDoc = doc(db, 'Usuario', editingUser.id)
      const updatedData = {
        ...editFormData,
        DataNascimento: editFormData.DataNascimento
          ? Timestamp.fromDate(
              new Date(`${editFormData.DataNascimento}T12:00:00`)
            )
          : null,
      }
      await updateDoc(userDoc, updatedData) // Aqui usamos updatedData em vez de editFormData
      alert('Usuário atualizado com sucesso!')
      const updatedUsuarios = usuarios.map(user =>
        user.id === editingUser.id ? { ...updatedData, id: editingUser.id } : user
      )
      setUsuarios(updatedUsuarios)
      setFilteredUsuarios(updatedUsuarios)
      setEditingUser(null)
    } catch (e) {
      console.error('Erro ao atualizar usuário: ', e)
      alert('Erro ao atualizar usuário: ' + e.message)
    }
  }
  return (
    <div className={style.container}>
      <input
        className={style.searchInput}
        type="text"
        placeholder="Pesquisar por nome..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <ul className={style.userList}>
        {filteredUsuarios.map(user => (
          <li
            key={user.id}
            className={`${style.userItem} ${activeUserId === user.id ? style.active : ''}`}
            onClick={() => toggleUserDetails(user.id)}
          >
            {user.Nome}
            <div className={style.userDetails}>
              <p>Email: {user.Email}</p>
              <p>Endereço: {user.Endereco}</p>
              <p>CPF: {user.CPF}</p>
              <p>Telefone: {user.Telefone}</p>
              <p>Data de Nascimento: {user.DataNascimento ? user.DataNascimento.toDate().toLocaleDateString() : 'Data não disponível'}</p>
              <button
                className={style.deleteButton}
                onClick={e => {
                  e.stopPropagation()
                  deleteUser(user.id)
                }}
              >
                Deletar
              </button>
              <button
                className={style.editButton}
                onClick={e => {
                  e.stopPropagation()
                  startEditUser(user)
                }}
              >
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editingUser && (
        <form className={style.editForm} onSubmit={saveEdits}>
          <h3>Editando Usuário: {editingUser.Nome}</h3>
          <label>
            Nome:
            <input
              type="text"
              name="Nome"
              value={editFormData.Nome}
              onChange={handleEditChange}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="Email"
              value={editFormData.Email}
              onChange={handleEditChange}
            />
          </label>
          <label>
            Endereço:
            <input
              type="text"
              name="Endereco"
              value={editFormData.Endereco}
              onChange={handleEditChange}
            />
          </label>
          <label>
            CPF:
            <input
              type="text"
              name="CPF"
              value={editFormData.CPF}
              onChange={handleEditChange}
            />
          </label>
          <label>
            Telefone:
            <input
              type="text"
              name="Telefone"
              value={editFormData.Telefone}
              onChange={handleEditChange}
            />
          </label>
          <label>
            Data de Nascimento:
            <input
              type="date"
              name="DataNascimento"
              value={editFormData.DataNascimento}
              onChange={handleEditChange}
            />
          </label>
          <button type="submit" className={style.editButton}>
            Salvar Alterações
          </button>
          <button
            type="button"
            className={style.deleteButton}
            onClick={() => setEditingUser(null)}
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  )
}

export default CrudCliente
