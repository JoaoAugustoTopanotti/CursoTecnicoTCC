import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../components/firebaseConfig';
import { adicionarAoCarrinho } from '../../components/carrinhoUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Produto = () => {
  const router = useRouter();
  const { id } = router.query; // Pega o ID da URL
  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Carrega o script do Stripe dinamicamente
    const script = document.createElement('script');
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => {
      console.log("Stripe carregado com sucesso");
    };
    script.onerror = () => {
      console.error("Falha ao carregar o Stripe");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Remove o script quando o componente é desmontado
    };
  }, []); // O array vazio [] garante que isso só execute uma vez quando o componente é montado

  useEffect(() => {
    if (id) {
      const buscarProduto = async () => {
        try {
          const produtoRef = doc(db, 'Produtos', id);
          const produtoSnap = await getDoc(produtoRef);

          if (produtoSnap.exists()) {
            setProduto(produtoSnap.data());
          } else {
            console.error('Produto não encontrado');
          }
        } catch (error) {
          console.error('Erro ao buscar produto:', error);
        } finally {
          setCarregando(false);
        }
      };

      buscarProduto();
    }
  }, [id]);

  if (carregando) {
    return <p>Carregando produto...</p>;
  }

  if (!produto) {
    return <p>Produto não encontrado</p>;
  }

  const handleAdicionarAoCarrinho = async () => {
    try {
      await adicionarAoCarrinho(id, produto);
      toast.success('Produto adicionado ao carrinho', {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho', {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const handleComprarAgora = async () => {
    console.log("Botão 'Comprar Agora' clicado");
    try {
      // Verifica se o Stripe foi carregado corretamente
      if (!window.Stripe) {
        console.error('Stripe não foi carregado corretamente');
        toast.error('Erro ao carregar o Stripe', {
          position: 'top-center',
          autoClose: 2000,
        });
        return;
      }
  
      // Faz a requisição para criar a sessão de checkout
      const response = await fetch('/api/criarCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceID: produto.priceID, // Certifique-se de que isso é o ID do preço real do Stripe
          Quantidade: 1, // A quantidade de produtos a ser comprada
          produtoId: id, // Certifique-se de que 'id' é o ID do produto que você quer passar
          descricao: produto.Descrição,
          imagem: produto.Imagem,
          nome: produto.Nome,
          preco: produto.Preco,
        }),
      });
  
      // Se a resposta não for OK, lança um erro
      if (!response.ok) {
        throw new Error(`Erro de HTTP! status: ${response.status}`);
      }
  
      const data = await response.json(); // Garante que a resposta seja um JSON
  
      // Verifica se a sessão foi criada corretamente
      if (data.sessionId) {
        const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE);
  
        // Redireciona para o checkout do Stripe
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
  
        // Se houver erro no redirecionamento para o checkout
        if (error) {
          console.error('Erro ao redirecionar para o checkout:', error);
          toast.error('Erro ao processar a compra', {
            position: 'top-center',
            autoClose: 2000,
          });
        }
      }
    } catch (error) {
      // Trata erros no processo de checkout
      console.error('Erro ao chamar a função:', error);
      toast.error('Erro ao processar a compra', {
        position: 'top-center',
        autoClose: 2000,
      });
    }
  };
  

  return (
    <div>
      <h1>{produto.Nome}</h1>
      <img src={produto.Imagem} alt={produto.Nome} style={{ maxWidth: '300px' }} />
      <p>Preço: R${produto.Preço}</p>
      <p>Quantidade: {produto.Quantidade}</p>
      <p>Descrição: {produto.Descrição ? produto.Descrição : 'Nenhuma descrição disponível'}</p>

      <button onClick={handleAdicionarAoCarrinho}>Adicionar ao Carrinho</button>
      <button onClick={handleComprarAgora}>Comprar Agora</button>

      <ToastContainer />
    </div>
  );
};

export default Produto;
