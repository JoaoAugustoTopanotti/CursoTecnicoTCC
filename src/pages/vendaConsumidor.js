import React, { useState, useEffect } from 'react';
import { db } from '../components/firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Autocomplete, TextField } from '@mui/material';
import BarcodeReader from 'react-barcode-reader';

function VendaConsumidor() {
  const [produtoID, setProdutoID] = useState('');
  const [usuarioID, setUsuarioID] = useState('');
  const [quantidade, setQuantidade] = useState(1); // Começa com 1 para evitar zero
  const [vendedorID, setVendedorID] = useState('');
  const [valorTotal, setValorTotal] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Produtos
        const produtosRef = collection(db, 'Produtos');
        const produtosSnap = await getDocs(produtosRef);
        const produtosList = produtosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProdutos(produtosList);

        // Fetch Usuários
        const usuariosRef = collection(db, 'Usuario');
        const usuariosSnap = await getDocs(usuariosRef);
        const usuariosList = usuariosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(usuariosList);

        // Fetch Vendedores
        const vendedoresRef = collection(db, 'Vendedor');
        const vendedoresSnap = await getDocs(vendedoresRef);
        const vendedoresList = vendedoresSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendedores(vendedoresList);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, []);

  // Atualiza o valor total e a quantidade disponível quando um produto é selecionado
  useEffect(() => {
    if (produtoID) {
      const selectedProduct = produtos.find(produto => produto.id === produtoID);
      if (selectedProduct) {
        setProdutoSelecionado(selectedProduct);
        setQuantidadeDisponivel(selectedProduct.Quantidade || 0);
        setValorTotal(selectedProduct.Preco * quantidade);
      }
    }
  }, [produtoID, quantidade, produtos]);

  // Atualiza o valor total quando a quantidade é alterada
  useEffect(() => {
    if (produtoSelecionado) {
      setValorTotal(produtoSelecionado.Preco * quantidade);
    }
  }, [quantidade, produtoSelecionado]);

  const handleQuantidadeChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 1 && value <= quantidadeDisponivel) {
      setQuantidade(value);
    } else if (value > quantidadeDisponivel) {
      alert('Quantidade excede a disponibilidade do produto.');
    }
  };

  const handleVenda = async () => {
    if (quantidade <= 0 || quantidade > quantidadeDisponivel) {
      alert('A quantidade deve ser maior que zero e não pode exceder a disponibilidade do produto.');
      return;
    }

    try {
      // Adiciona a venda na coleção "Vendas"
      await addDoc(collection(db, 'Vendas'), {
        DataHora: new Date(),
        ProdutoID: produtoID,
        UsuarioID: usuarioID,
        Quantidade: quantidade,
        VendedorID: vendedorID,
        ValorTotal: valorTotal,
      });

      // Atualiza o estoque do produto
      const produtoRef = doc(db, 'Produtos', produtoID);
      await updateDoc(produtoRef, {
        Quantidade: quantidadeDisponivel - quantidade
      });

      alert('Venda registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar a venda:', error);
      alert('Erro ao registrar a venda');
    }
  };

  return (
    <div>
      <h1>Venda ao Consumidor</h1>
      <form>
        <label>
          <Autocomplete
            options={produtos}
            getOptionLabel={(option) => option.Nome || option.id} // Exibe o nome do produto ou ID se não houver nome
            onChange={(event, newValue) => {
              setProdutoID(newValue ? newValue.id : '');
              setQuantidade(1); // Reseta a quantidade quando o produto é alterado
            }}
            renderInput={(params) => <TextField {...params} label="Escolha um produto" />}
          />
        </label>
        <br />
        <label>
          <Autocomplete
            options={usuarios}
            getOptionLabel={(option) => option.login || option.email} // Exibe login do usuário ou email se não houver login
            onChange={(event, newValue) => setUsuarioID(newValue ? newValue.id : '')}
            renderInput={(params) => <TextField {...params} label="Escolha um usuário" />}
          />
        </label>
        <br />
        <label>
          Vendedor:
          <Autocomplete
            options={vendedores}
            getOptionLabel={(option) => option.Nome || option.email} // Exibe nome do vendedor ou email se não houver nome
            onChange={(event, newValue) => setVendedorID(newValue ? newValue.id : '')}
            renderInput={(params) => <TextField {...params} label="Escolha um vendedor" />}
          />
        </label>
        <br />
        <BarcodeReader
          onError={console.error}
          onScan={(data) => setProdutoID(data)} // Use o código do produto lido
        />
        <br />
        <label>
          <p>{produtoSelecionado ? `Este produto possui ${quantidadeDisponivel} unidades restantes.` : ''}</p>
          Quantidade:
          <input
            type="number"
            value={quantidade}
            onChange={handleQuantidadeChange}
            required
            min="1"
          />
        </label>
        <br />
        <label>
          Valor Total: R${valorTotal.toFixed(2)}
        </label>
        <br />
        <button type="button" onClick={handleVenda}>
          Registrar Venda
        </button>
      </form>
    </div>
  );
}

export default VendaConsumidor;
