import {
  getFirestore,
  collection,
  doc,
  deleteDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../components/firebaseConfig'
import style from './visualizarProduto.module.css'

const ProdutosCollectionRef = collection(db, 'Produtos')

export const CrudProduto = () => {
  const [Produtos, setProdutos] = useState([])
  const [filteredProdutos, setFilteredProdutos] = useState([])
  const [activeClientId, setActiveClientId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingProductId, setEditingProductId] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => {
    const getProdutos = async () => {
      const data = await getDocs(ProdutosCollectionRef)
      const sortedProdutos = await Promise.all(
        data.docs.map(async doc => {
          // Acessa Marca e Categoria dentro do produto
          const marcaSnapshot = await getDocs(collection(doc.ref, 'Marca'))
          const categoriaSnapshot = await getDocs(
            collection(doc.ref, 'Categoria')
          )

          const marca =
            marcaSnapshot.docs.length > 0 ? marcaSnapshot.docs[0].id : ''
          const categoria =
            categoriaSnapshot.docs.length > 0
              ? categoriaSnapshot.docs[0].id
              : ''

          return { ...doc.data(), id: doc.id, marca, categoria }
        })
      )
      setProdutos(sortedProdutos)
      setFilteredProdutos(sortedProdutos)
    }
    getProdutos()
  }, [])

  const handleSearch = e => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    const filtered = Produtos.filter(prod =>
      prod.Nome.toLowerCase().includes(term)
    )
    setFilteredProdutos(filtered)
  }

  const toggleProductDetails = id => {
    setActiveClientId(activeClientId === id ? null : id)
  }

  async function deleteUser(id) {
    try {
      const productDoc = doc(db, 'Produtos', id)
      await deleteDoc(productDoc)
      alert('Produto deletado com sucesso!')
      setProdutos(Produtos.filter(prod => prod.id !== id))
      setFilteredProdutos(filteredProdutos.filter(prod => prod.id !== id))
    } catch (e) {
      console.error('Erro ao deletar produto: ', e)
      alert('Erro ao deletar produto: ' + e.message)
    }
  }

  const startEditProduct = prod => {
    setEditingProductId(prod.id)
    setEditFormData(prod)
  }

  const handleEditChange = e => {
    const { name, value } = e.target

    // Convertendo Preco e Quantidade para Number se necessário
    const parsedValue =
      name === 'Preco' || name === 'Quantidade' ? parseFloat(value) : value

    setEditFormData({
      ...editFormData,
      [name]: parsedValue,
    })
  }

  const saveEdits = async e => {
    e.preventDefault()

    try {
      const productDoc = doc(db, 'Produtos', editingProductId)

      // Extraindo marca e categoria
      const { categoria, marca, ...productData } = editFormData

      // Atualizar os campos do documento principal, excluindo 'categoria' e 'marca'
      await updateDoc(productDoc, productData)

      // Atualizar subcoleção Marca
      if (marca) {
        const marcaDoc = doc(collection(productDoc, 'Marca'), marca)
        await updateDoc(marcaDoc, { dummyField: true }) // Adiciona um campo fictício ou simplesmente assegura que o documento existe
      }

      // Atualizar subcoleção Categoria
      if (categoria) {
        const categoriaDoc = doc(collection(productDoc, 'Categoria'), categoria)
        await updateDoc(categoriaDoc, { dummyField: true })
      }

      alert('Produto atualizado com sucesso!')

      const updatedProdutos = Produtos.map(prod =>
        prod.id === editingProductId
          ? { ...editFormData, id: editingProductId }
          : prod
      )
      setProdutos(updatedProdutos)
      setFilteredProdutos(updatedProdutos)
      setEditingProductId(null)
    } catch (e) {
      console.error('Erro ao atualizar produto: ', e)
      alert('Erro ao atualizar produto: ' + e.message)
    }
  }

  return (
    <div className={style.container}>
      <h1 className={style.title}>Visualizar Produtos</h1>
      <input
        className={style.searchInput}
        type="text"
        placeholder="Pesquisar por nome..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <ul className={style.clientList}>
        {filteredProdutos.map(prod => (
          <li
            key={prod.id}
            className={`${style.clientItem} ${activeClientId === prod.id ? style.active : ''}`}
            onClick={() => toggleProductDetails(prod.id)}
          >
            <div className={style.clientDetails}>
              <p>Nome: {prod.Nome}</p>
              <p>Preço: R$ {prod.Preco}</p>
              <p>Marca: {prod.marca}</p>
              <p>Quantidade: {prod.Quantidade}</p>
              <p>Categoria: {prod.categoria}</p>
              <p>Descrição: {prod.Descricao}</p>
              <button
                className={style.editButton}
                onClick={e => {
                  e.stopPropagation()
                  startEditProduct(prod)
                }}
              >
                Editar
              </button>
              <button
                className={style.deleteButton}
                onClick={e => {
                  e.stopPropagation()
                  deleteUser(prod.id)
                }}
              >
                Deletar
              </button>

              {editingProductId === prod.id && (
                <form className={style.editForm} onSubmit={saveEdits}>
                  <h3>Editando Produto: {prod.Nome}</h3>
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
                    Preço:
                    <input
                      type="text"
                      name="Preco"
                      value={editFormData.Preco || ''}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Descrição:
                    <input
                      type="text"
                      name="Descricao"
                      value={editFormData.Descricao || ''}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Quantidade:
                    <input
                      type="number"
                      name="Quantidade"
                      value={editFormData.Quantidade || ''}
                      onChange={handleEditChange}
                    />
                  </label>
                  <button type="submit">Salvar Alterações</button>
                  <button
                    type="button"
                    onClick={() => setEditingProductId(null)}
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
            {prod.Imagem && (
              <div className={style.productImage}>
                <img src={prod.Imagem} alt="Imagem do Produto" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CrudProduto
