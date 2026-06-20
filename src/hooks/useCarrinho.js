// Concentra toda a lógica de dados do carrinho: buscar itens, buscar o endereço
// do usuário, ajustar quantidade, remover item e calcular o subtotal.
// Tira essa responsabilidade do componente Cart (que era um "God Component").

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../components/firebaseConfig'
import { useAuth } from '../components/authContext'
import { useEnderecoUsuario } from './useEnderecoUsuario'
import { notificarErro } from '../utils/notificacoes'

export function useCarrinho() {
  const { currentUser } = useAuth()
  const endereco = useEnderecoUsuario()
  const [itens, setItens] = useState([])
  const [quantidades, setQuantidades] = useState({})

  // Busca os itens do carrinho do usuário.
  useEffect(() => {
    if (!currentUser?.uid) return

    const buscarItens = async () => {
      try {
        const carrinhoSnap = await getDoc(doc(db, 'Carrinho', currentUser.uid))
        if (!carrinhoSnap.exists()) return

        const { Itens } = carrinhoSnap.data()
        if (!Array.isArray(Itens)) return

        const quantidadesIniciais = {}
        const itensValidos = Itens.filter(item => {
          if (item.Nome && item.Preco) {
            quantidadesIniciais[item.produtoId] = 1
            return true
          }
          return false
        })

        setQuantidades(quantidadesIniciais)
        setItens(itensValidos)
      } catch (error) {
        notificarErro('Não foi possível carregar o carrinho.')
        console.error('Erro ao buscar itens do carrinho:', error)
      }
    }

    buscarItens()
  }, [currentUser])

  const ajustarQuantidade = async (produtoId, novaQuantidade, estoqueDisponivel) => {
    if (novaQuantidade <= 0 || novaQuantidade > estoqueDisponivel) {
      notificarErro('A quantidade selecionada excede o estoque disponível.')
      return
    }

    try {
      setQuantidades(anterior => ({ ...anterior, [produtoId]: novaQuantidade }))

      const carrinhoRef = doc(db, 'Carrinho', currentUser.uid)
      const carrinhoSnap = await getDoc(carrinhoRef)
      if (carrinhoSnap.exists()) {
        const itensAtualizados = carrinhoSnap.data().Itens.map(item =>
          item.produtoId === produtoId
            ? { ...item, quantidade: novaQuantidade }
            : item
        )
        await updateDoc(carrinhoRef, { Itens: itensAtualizados })
      }
    } catch (error) {
      notificarErro('Não foi possível atualizar a quantidade.')
      console.error('Erro ao atualizar a quantidade:', error)
    }
  }

  const removerDoCarrinho = async produtoId => {
    try {
      const carrinhoRef = doc(db, 'Carrinho', currentUser.uid)
      const itemRemovido = itens.find(item => item.produtoId === produtoId)
      await updateDoc(carrinhoRef, { Itens: arrayRemove(itemRemovido) })
      setItens(itens.filter(item => item.produtoId !== produtoId))
    } catch (error) {
      notificarErro('Não foi possível remover o item.')
      console.error('Erro ao remover item do carrinho:', error)
    }
  }

  const calcularSubtotal = useCallback(
    () =>
      itens.reduce((total, item) => {
        const preco = parseFloat(item.Preco) || 0
        const quantidade = quantidades[item.produtoId] || 1
        return total + preco * quantidade
      }, 0),
    [itens, quantidades]
  )

  return {
    itens,
    quantidades,
    endereco,
    ajustarQuantidade,
    removerDoCarrinho,
    calcularSubtotal,
  }
}
