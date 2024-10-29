import React from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from './firebaseConfig' // Certifique-se de que está importando o db corretamente

// Função para adicionar produtos ao carrinho
export const adicionarAoCarrinho = async (produtoId, produto) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.error('Usuário não autenticado')
    return
  }

  try {
    const carrinhoRef = doc(db, 'Carrinho', user.uid)
    const carrinhoSnap = await getDoc(carrinhoRef)

    if (carrinhoSnap.exists()) {
      // Atualiza o carrinho existente
      const carrinhoData = carrinhoSnap.data()
      const itensExistentes = Array.isArray(carrinhoData.Itens)
        ? carrinhoData.Itens
        : []

      // Verifica se o produto já está no carrinho
      const produtoExistente = itensExistentes.find(
        item => item.produtoId === produtoId
      )

      if (produtoExistente) {
        // Atualiza a quantidade do produto existente
        const novosItens = itensExistentes.map(item =>
          item.produtoId === produtoId ? { ...item, ...produto } : item
        )

        await updateDoc(carrinhoRef, { Itens: novosItens })
      } else {
        // Adiciona um novo produto ao carrinho
        await updateDoc(carrinhoRef, {
          Itens: arrayUnion({ produtoId, ...produto }),
        })
      }
    } else {
      // Cria um novo documento para o carrinho se não existir
      await setDoc(carrinhoRef, {
        Itens: [{ produtoId, ...produto }],
      })
    }
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error)
    toast.error('Erro ao adicionar produto ao carrinho', {
      position: 'top-center',
      autoClose: 2000,
    })
  }
}
