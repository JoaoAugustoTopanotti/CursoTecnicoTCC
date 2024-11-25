import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useState } from 'react'
import style from './adcCliente.module.css'
import { db } from '../components/firebaseConfig'

const storage = getStorage() // Inicialize o armazenamento

export const AdcProduto = () => {
  const [nome, setNome] = useState('')
  const [marca, setMarca] = useState('')
  const [priceID, setpriceID] = useState('')
  const [valor, setvalor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descrição, setDescrição] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [foto, setFoto] = useState(null)

  const handleFileChange = e => {
    setFoto(e.target.files[0])
  }

  const uploadImage = async file => {
    const storageRef = ref(storage, `Produtos/${file.name}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  const criarDado = async () => {
    try {
      let fotoURL = ''
      if (foto) {
        fotoURL = await uploadImage(foto)
      }
      const usersCollectionRef = collection(db, 'Produtos')
      const produtoDocRef = await addDoc(usersCollectionRef, {
        Nome: nome,
        Preco: Number.parseFloat(valor),
        priceID,
        Descricao: descrição,
        Quantidade: Number.parseInt(quantidade),
        Imagem: fotoURL,
      })

      // Crie subcoleções de Marca e Categoria dentro do produto
      if (marca) {
        await setDoc(doc(db, `Produtos/${produtoDocRef.id}/Marca/${marca}`), {
          nome: marca,
        })
      }

      if (categoria) {
        await setDoc(
          doc(db, `Produtos/${produtoDocRef.id}/Categoria/${categoria}`),
          { nome: categoria }
        )
      }
      console.log('dados salvos com sucesso', produtoDocRef)
      alert('Dados salvos com sucesso!')

      // Recarregar a página
      window.location.reload()
    } catch (e) {
      console.error('Error adding document: ', e)
      alert('Erro ao salvar os dados: ' + e.message)
    }
  }

  return (
    <div className={style.container}>
      <div className={style.titulo}>Adicionar Produtos</div>
      <input
        className={style.input}
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={e => setNome(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Marca"
        value={marca}
        onChange={e => setMarca(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="priceID"
        value={priceID}
        onChange={e => setpriceID(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Valor"
        value={valor}
        onChange={e => setvalor(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Categoria"
        value={categoria}
        onChange={e => setCategoria(e.target.value)}
      />
      <input
        className={style.input}
        type="text"
        placeholder="Descrição"
        value={descrição}
        onChange={e => setDescrição(e.target.value)}
      />
      <input
        className={style.input}
        type="number"
        placeholder="Quantidade"
        value={quantidade}
        onChange={e => setQuantidade(e.target.value)}
      />
      <input className={style.input} type="file" onChange={handleFileChange} />
      <button className={style.button} onClick={criarDado}>
        Criar dado
      </button>
    </div>
  )
}

export default AdcProduto
