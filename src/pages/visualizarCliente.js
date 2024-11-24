import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../components/firebaseConfig';
import style from './visualizarCliente.module.css';

const UsuarioCollectionRef = collection(db, 'Usuario');

export const CrudCliente = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchUsuarios = async () => {
      const data = await getDocs(UsuarioCollectionRef);
      const sortedUsuarios = data.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
      setUsuarios(sortedUsuarios);
      setFilteredUsuarios(sortedUsuarios);
    };
    fetchUsuarios();
  }, []);

  const handleSearch = e => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = usuarios.filter(user =>
      user.Nome.toLowerCase().includes(term)
    );
    setFilteredUsuarios(filtered);
  };

  const deleteUser = async id => {
    try {
      const userDoc = doc(db, 'Usuario', id);
      await deleteDoc(userDoc);
      alert('Usuário deletado com sucesso!');
      setUsuarios(usuarios.filter(user => user.id !== id));
      setFilteredUsuarios(filteredUsuarios.filter(user => user.id !== id));
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário: ' + error.message);
    }
  };

  const startEditUser = user => {
    setEditingUserId(user.id);
    setEditFormData({
      ...user,
      DataNascimento: user.DataNascimento
        ? user.DataNascimento.toDate().toISOString().split('T')[0]
        : '',
    });
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const saveEdits = async e => {
    e.preventDefault();
    try {
      const userDoc = doc(db, 'Usuario', editingUserId);
      const updatedUser = {
        ...editFormData,
        DataNascimento: editFormData.DataNascimento
          ? Timestamp.fromDate(new Date(editFormData.DataNascimento))
          : null,
      };
      await updateDoc(userDoc, updatedUser);
      alert('Usuário atualizado com sucesso!');
      const updatedUsuarios = usuarios.map(user =>
        user.id === editingUserId ? { ...updatedUser, id: editingUserId } : user
      );
      setUsuarios(updatedUsuarios);
      setFilteredUsuarios(updatedUsuarios);
      setEditingUserId(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário: ' + error.message);
    }
  };

  return (
    <div className={style.container}>
      <h1 className={style.title}>Visualizar Clientes</h1>
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
            className={`${style.userItem} ${
              editingUserId === user.id ? style.active : ''
            }`}
          >
            <div className={style.userDetails}>
              <p>Nome: {user.Nome}</p>
              <p>Email: {user.Email}</p>
              <p>Endereço: {user.Endereco}</p>
              <p>CPF: {user.CPF}</p>
              <p>Telefone: {user.Telefone}</p>
              <p>
                Data de Nascimento:{' '}
                {user.DataNascimento
                  ? user.DataNascimento.toDate().toLocaleDateString()
                  : 'Não disponível'}
              </p>
              <div className={style.buttons}>
                <button
                  className={style.editButton}
                  onClick={() => startEditUser(user)}
                >
                  Editar
                </button>
                <button
                  className={style.deleteButton}
                  onClick={() => deleteUser(user.id)}
                >
                  Deletar
                </button>
              </div>
            </div>

            {editingUserId === user.id && (
              <form className={style.editForm} onSubmit={saveEdits}>
                <h3>Editando Usuário: {user.Nome}</h3>
                <label>
                  Nome:
                  <input
                    type="text"
                    name="Nome"
                    value={editFormData.Nome || ''}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  Email:
                  <input
                    type="email"
                    name="Email"
                    value={editFormData.Email || ''}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  Endereço:
                  <input
                    type="text"
                    name="Endereco"
                    value={editFormData.Endereco || ''}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  CPF:
                  <input
                    type="text"
                    name="CPF"
                    value={editFormData.CPF || ''}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  Telefone:
                  <input
                    type="text"
                    name="Telefone"
                    value={editFormData.Telefone || ''}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  Data de Nascimento:
                  <input
                    type="date"
                    name="DataNascimento"
                    value={editFormData.DataNascimento || ''}
                    onChange={handleEditChange}
                  />
                </label>
                  <button type="submit" className={style.savebotao}>Salvar Alterações</button>
                  <button type="button" className={style.deletebotao}onClick={() => setEditingUserId(null)}>
                    Cancelar
                  </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CrudCliente;
