import { db } from "../components/firebaseConfig";
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import style from "./visualizarVendedor.module.css"


export const CrudVendedor = () => {
  const [Vendedores, setVendedores] = useState([]);
  const [filteredVendedores, setFilteredVendedores] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const VendedoresCollectionRef = collection(db, "Vendedor");

  useEffect(() => {
    const getVendedores = async () => {
      const data = await getDocs(VendedoresCollectionRef);
      const sortedClients = data.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .sort((a, b) => a.Nome.localeCompare(b.Nome)); // Ordena os nomes alfabeticamente
      setVendedores(sortedClients);
      setFilteredVendedores(sortedClients); // Inicialmente, a lista filtrada é a lista completa
    };
    getVendedores();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = Vendedores.filter((client) =>
      client.Nome.toLowerCase().includes(term)
    );
    setFilteredVendedores(filtered);
  };

  const toggleClientDetails = (id) => {
    setActiveClientId(activeClientId === id ? null : id);
  };

  async function deleteUser(id) {
    try {
      const userDoc = doc(db, "Vendedor", id);
      await deleteDoc(userDoc);
      alert("Usuário deletado com sucesso!");
      setVendedores(Vendedores.filter((user) => user.id !== id));
      setFilteredVendedores(
        filteredVendedores.filter((user) => user.id !== id)
      );
    } catch (e) {
      console.error("Erro ao deletar usuário: ", e);
      alert("Erro ao deletar usuário: " + e.message);
    }
  }

  return (
    <div className={style.container}>
      <div className={style.titulo}>Visualizar Vendedor</div>
      <input
        className={style.searchInput}
        type="text"
        placeholder="Pesquisar por nome..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <ul className={style.clientList}>
        {filteredVendedores.map((user) => (
          <li
            key={user.id}
            className={`${style.clientItem} ${
              activeClientId === user.id ? style.active : ""
            }`}
            onClick={() => toggleClientDetails(user.id)}
          >
            {user.Nome}
            <div className={style.clientDetails}>
              <p>Email: {user.Email}</p>
              <p>Função: {user.Funcao}</p>
              <p>Salário: {user.Salario}</p>
              <p>Vendas no Mês: {user.VendasMes}</p>
              <button
                className={style.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteUser(user.id);
                }}
              >
                Deletar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CrudVendedor