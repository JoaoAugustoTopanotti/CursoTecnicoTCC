import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const auth = getAuth();
  const user = auth.currentUser;

  // Função para buscar os itens do carrinho
  useEffect(() => {
    const fetchCartItems = async () => {
      if (user) {
        try {
          const cartRef = doc(db, 'Carrinho', user.uid);
          const cartSnap = await getDoc(cartRef);

          if (cartSnap.exists()) {
            const { Itens } = cartSnap.data();
            console.log('Itens do carrinho:', Itens);

            if (Itens && Array.isArray(Itens)) {
              const initialQuantities = {};
              const validItems = Itens.filter((item) => {
                if (item.Nome && item.Preco) {
                  // Define a quantidade inicial como 1 para todos os itens no carrinho
                  initialQuantities[item.produtoId] = 1; // Inicia com 1
                  return true;
                }
                return false;
              });

              setProductQuantities(initialQuantities);
              setCartItems(validItems);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar itens do carrinho:', error);
        }
      }
    };

    fetchCartItems();
  }, [user]);

  // Função para calcular o valor total do carrinho
  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = cartItems.reduce((acc, item) => {
        const quantity = productQuantities[item.produtoId] || 1;
        return acc + item.Preco * quantity;
      }, 0);
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [cartItems, productQuantities]);

  // Função para ajustar a quantidade do item no carrinho
  const ajustarQuantidade = (produtoId, novaQuantidade, estoqueDisponivel) => {
    if (novaQuantidade <= estoqueDisponivel && novaQuantidade > 0) {
      // Atualiza o estado local
      setProductQuantities((prevQuantities) => ({
        ...prevQuantities,
        [produtoId]: novaQuantidade,
      }));
    } else {
      // Exibe uma notificação caso o usuário exceda o limite do estoque
      alert('A quantidade selecionada excede o estoque disponível.');
    }
  };

  // Função para remover um item do carrinho
  const removerDoCarrinho = async (produtoId) => {
    if (user) {
      try {
        const cartRef = doc(db, 'Carrinho', user.uid);
        const produtoRemover = cartItems.find((item) => item.produtoId === produtoId);

        // Remove o produto do array Itens no Firestore
        await updateDoc(cartRef, {
          Itens: arrayRemove(produtoRemover),
        });

        // Atualiza o estado local removendo o item
        setCartItems(cartItems.filter((item) => item.produtoId !== produtoId));
      } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
      }
    }
  };

  return (
    <div>
      <h2>Meu Carrinho</h2>
      {cartItems.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              <img
                src={item.Imagem || 'default-image-url'} // URL de imagem padrão
                alt={item.Nome}
                style={{ width: '50px', height: '50px' }}
              />
              <p>{item.Nome} - R${item.Preco}</p>
              <p>Quantidade no carrinho: {productQuantities[item.produtoId]}</p>
              <button
                onClick={() =>
                  ajustarQuantidade(item.produtoId, productQuantities[item.produtoId] - 1, item.Quantidade)
                }
              >
                -
              </button>
              <button
                onClick={() =>
                  ajustarQuantidade(item.produtoId, productQuantities[item.produtoId] + 1, item.Quantidade)
                }
              >
                +
              </button>
              {/* Botão para remover o produto do carrinho */}
              <button onClick={() => removerDoCarrinho(item.produtoId)}>Remover</button>
            </li>
          ))}
        </ul>
      )}
      {cartItems.length > 0 && (
        <>
          {/* Campo para mostrar o valor total do carrinho */}
          <h3>Valor Total do Carrinho: R${totalPrice.toFixed(2)}</h3>
          {/* Botão de comprar */}
          <button>Comprar</button>
        </>
      )}
    </div>
  );
};

export default Cart;
