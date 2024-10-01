// src/pages/Gerente.js
import React, { useState, useEffect } from 'react';
import { db } from '../components/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import styles from './Gerente.module.css';

function Gerente() {
  const [nomeGerente, setNomeGerente] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchGerenteData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Gerente'));
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setNomeGerente(doc.data().login || ''); // Ajuste conforme necessário
        } else {
          console.log('Nenhum documento encontrado na coleção Gerente');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gerente:', error);
      }
    };

    fetchGerenteData();
  }, []);

  return (
    <div className={styles.gerenteContainer}>
      <div className={styles.gerenteContent}>
        <h2>Seja Bem-Vindo, {nomeGerente}!</h2>
      </div>
      <div className={styles.gerenteMain}>
        <div className={styles.gerenteImage}>
          <img src="https://i.pinimg.com/564x/75/34/e2/7534e25d8b7adc635cc1895855cd1c3b.jpg" alt="Gerente" />
        </div>
        <div className={styles.gerenteButtons}>
          <button onClick={() => router.push('/vendaConsumidor')}>Venda ao Consumidor</button>
          <button onClick={() => router.push('/adicionarCliente')}>Adicionar Cliente</button>
          <button onClick={() => router.push('/visualizarClientes')}>Visualizar Clientes</button>
          <button onClick={() => router.push('/adicionarProduto')}>Adicionar Produto</button>
          <button onClick={() => router.push('/visualizarProdutos')}>Visualizar Produtos</button>
          <button onClick={() => router.push('/adicionarVendedor')}>Adicionar Vendedor</button>
          <button onClick={() => router.push('/visualizarVendedores')}>Visualizar Vendedores</button>
          <button onClick={() => router.push('/adcPet')}>Adicionar Pet Banho e Tosa</button>
          <button onClick={() => router.push('/visualizarAgenda')}>Visualizar Agenda</button>
          <button onClick={() => router.push('/faturamento')}>Faturamento</button>
        </div>
      </div>
    </div>
  );
}

export default Gerente;
