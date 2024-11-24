import React, { useState, useEffect } from 'react';
import { db } from '../components/firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Autocomplete, TextField } from '@mui/material';
import styles from './VendaConsumidor.module.css'; // Importa o arquivo CSS

function VendaConsumidor() {
  const [produtoID, setProdutoID] = useState('');
  const [usuarioID, setUsuarioID] = useState('');
  const [vendedorID, setVendedorID] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [produtos, setProdutos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [valorTotal, setValorTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const produtosSnap = await getDocs(collection(db, 'Produtos'));
        const produtosList = produtosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProdutos(produtosList);

        const usuariosSnap = await getDocs(collection(db, 'Usuario'));
        const usuariosList = usuariosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsuarios(usuariosList);

        const vendedoresSnap = await getDocs(collection(db, 'Vendedor'));
        const vendedoresList = vendedoresSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVendedores(vendedoresList);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (produtoID) {
      const selectedProduct = produtos.find((produto) => produto.id === produtoID);
      if (selectedProduct) {
        setProdutoSelecionado(selectedProduct);
        setQuantidadeDisponivel(selectedProduct.Quantidade || 0);
      }
    }
  }, [produtoID, produtos]);

  useEffect(() => {
    const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
    setValorTotal(total);
  }, [carrinho]);

  const adicionarAoCarrinho = () => {
    if (quantidade <= 0 || quantidade > quantidadeDisponivel) {
      alert('Quantidade inválida!');
      return;
    }

    if (!produtoSelecionado) {
      alert('Selecione um produto.');
      return;
    }

    setCarrinho((prev) => [
      ...prev,
      {
        id: produtoSelecionado.id,
        nome: produtoSelecionado.Nome,
        preco: produtoSelecionado.Preco,
        quantidade,
      },
    ]);

    setProdutoID('');
    setProdutoSelecionado(null);
    setQuantidade(1);
  };

  const removerDoCarrinho = (index) => {
    setCarrinho((prev) => prev.filter((_, i) => i !== index));
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda.');
      return;
    }

    if (!vendedorID) {
      alert('Selecione um vendedor.');
      return;
    }

    try {
      await addDoc(collection(db, 'Vendas'), {
        DataHora: new Date(),
        UsuarioID: usuarioID,
        VendedorID: vendedorID,
        Produtos: carrinho,
        ValorTotal: valorTotal,
      });

      // Atualiza o estoque
      carrinho.forEach(async (item) => {
        const produtoRef = doc(db, 'Produtos', item.id);
        const novoEstoque =
          produtos.find((prod) => prod.id === item.id).Quantidade - item.quantidade;
        await updateDoc(produtoRef, { Quantidade: novoEstoque });
      });

      alert('Venda registrada com sucesso!');
      setCarrinho([]);
      setUsuarioID('');
      setVendedorID('');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao registrar a venda:', error);
      alert('Erro ao registrar a venda.');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Venda ao Consumidor</h1>
      <form className={styles.form}>
        <Autocomplete
          options={produtos}
          getOptionLabel={(option) => option.Nome || option.id}
          onChange={(event, newValue) => {
            setProdutoID(newValue ? newValue.id : '');
            setQuantidade(1);
          }}
          renderInput={(params) => <TextField {...params} label="Escolha um produto" />}
        />
        <p className={styles.quantityInfo}>
          {produtoSelecionado
            ? `Este produto possui ${quantidadeDisponivel} unidades restantes.`
            : ''}
        </p>
        <label className={styles.label}>
          Quantidade
          <input
            className={styles.input}
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            min="1"
            max={quantidadeDisponivel}
          />
        </label>
        <button type="button" className={styles.addButton} onClick={adicionarAoCarrinho}>
          <img src="/adcbotao.png" alt="Logo" width={35}/>
        </button>
      </form>

      <h2 className={styles.title}>Produtos Adicionados</h2>
      <ul className={styles.cartList}>
        {carrinho.map((item, index) => (
          <li key={index} className={styles.cartItem}>
            <div className={styles.nome}>{item.nome}</div> {item.quantidade} x R$ {item.preco.toFixed(2)}
            <button
              className={styles.removeButton}
              onClick={() => removerDoCarrinho(index)}
            >
              <img src="/lixeira.png" alt="Logo" width={40}/>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.total}>Valor: R${valorTotal.toFixed(2)}</p>

      <Autocomplete
        options={vendedores}
        getOptionLabel={(option) => option.Nome || option.id}
        onChange={(event, newValue) => setVendedorID(newValue ? newValue.id : '')}
        renderInput={(params) => <TextField {...params} label="Escolha um vendedor" />}
      />
      <button
        type="button"
        className={styles.finalizarBtn}
        onClick={finalizarVenda}
      >
        Finalizar Venda
      </button>
    </div>
  );
}

export default VendaConsumidor;
