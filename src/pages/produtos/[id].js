import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../components/firebaseConfig'
import { adicionarAoCarrinho } from '../../components/carrinhoUtils'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Produto = () => {
  const router = useRouter()
  const { id } = router.query // Pega o ID da URL
  const [produto, setProduto] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [quantidade, setQuantidade] = useState(1) // Adicionar estado para quantidade

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => {
      console.log('Stripe carregado com sucesso')
    }
    script.onerror = () => {
      console.error('Falha ao carregar o Stripe')
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (id) {
      const buscarProduto = async () => {
        try {
          const produtoRef = doc(db, 'Produtos', id)
          const produtoSnap = await getDoc(produtoRef)

          if (produtoSnap.exists()) {
            setProduto(produtoSnap.data())
            console.log('Produto encontrado:', produtoSnap.data())
          } else {
            console.error('Produto não encontrado')
          }
        } catch (error) {
          console.error('Erro ao buscar produto:', error)
        } finally {
          setCarregando(false)
        }
      }

      buscarProduto()
    }
  }, [id])

  if (carregando) {
    return <p>Carregando produto...</p>
  }

  if (!produto) {
    return <p>Produto não encontrado</p>
  }

  const handleAdicionarAoCarrinho = async () => {
    try {
      await adicionarAoCarrinho(id, { ...produto, quantidade }) // Passar quantidade
      toast.success('Produto adicionado ao carrinho', {
        position: 'top-center',
        autoClose: 2000,
      })
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      toast.error('Erro ao adicionar produto ao carrinho', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

  const handleComprarAgora = async () => {
    if (!id) {
      console.error('Produto ID não definido.')
      toast.error('Produto ID não encontrado.', {
        position: 'top-center',
        autoClose: 2000,
      })
      return
    }
    console.log("Botão 'Comprar Agora' clicado")

    try {
      if (!window.Stripe) {
        console.error('Stripe não foi carregado corretamente')
        toast.error('Erro ao carregar o Stripe', {
          position: 'top-center',
          autoClose: 2000,
        })
        return
      }

      // Inicia a requisição para criar uma sessão de checkout
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceID: produto.priceID,
          quantidade, // Passar a quantidade selecionada
          produtoId: id,
          nome: produto.Nome,
          descricao: produto.Descrição,
          imagem: produto.Imagem,
          preco: produto.Preco,
        }),
      })
      console.log('Resposta da API:', response)

      if (!response.ok) {
        throw new Error(`Erro de HTTP! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.sessionId) {
        const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE)
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })

        if (error) {
          console.error('Erro ao redirecionar para o checkout:', error)
          toast.error('Erro ao processar a compra', {
            position: 'top-center',
            autoClose: 2000,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao processar a compra:', error)
      toast.error('Erro ao processar a compra', {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

  return (
    <div>
      <h1>{produto.Nome}</h1>
      <img
        src={produto.Imagem}
        alt={produto.Nome}
        style={{ maxWidth: '300px' }}
      />
      <p>Preço: R${produto.Preço}</p>
      <p>Quantidade em estoque: {produto.Quantidade}</p>
      <p>
        Descrição:{' '}
        {produto.Descrição ? produto.Descrição : 'Nenhuma descrição disponível'}
      </p>

      <label htmlFor="quantidade">Quantidade:</label>
      <input
        type="number"
        id="quantidade"
        value={quantidade}
        min="1"
        max={produto.Quantidade} // Limitar ao máximo disponível em estoque
        onChange={e => setQuantidade(e.target.value)} // Atualizar quantidade
      />

      <button type="button" onClick={handleAdicionarAoCarrinho}>
        Adicionar ao Carrinho
      </button>
      <button type="submit" onClick={handleComprarAgora}>
        Comprar Agora
      </button>

      <ToastContainer />
    </div>
  )
}

export default Produto
