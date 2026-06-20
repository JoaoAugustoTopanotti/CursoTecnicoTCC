// Carrega a lista de produtos e aplica o filtro de busca por nome.
// Antes, esse fetch estava duplicado em 4 páginas.

import { useState, useEffect } from 'react'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'

export function useProdutos() {
  const [produtos, setProdutos] = useState([])
  const [termoBusca, setTermoBusca] = useState('')

  useEffect(() => {
    const buscarProdutos = async () => {
      const snapshot = await getDocs(query(collection(db, 'Produtos')))
      const lista = snapshot.docs.map(documento => {
        const dados = documento.data()
        return {
          id: documento.id,
          nome: dados.Nome,
          // O Firestore tem registros com e sem acento neste campo; cobrimos os dois.
          descricao: dados.Descricao ?? dados.Descrição ?? '',
          quantidade: dados.Quantidade,
          imagem: dados.Imagem,
          preco: dados.Preco,
        }
      })
      setProdutos(lista)
    }

    buscarProdutos()
  }, [])

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase())
  )

  return { produtos, produtosFiltrados, termoBusca, setTermoBusca }
}
