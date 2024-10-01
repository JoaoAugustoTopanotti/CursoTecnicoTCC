import React from 'react';
import { AuthProvider } from '../components/authContext';

function Home() {
  const { currentUser } = useAuth();

  console.log('Renderizando Home. Usuário atual:', currentUser); 

  return (
    <div>
      <h1>Bem-vindo à Página Inicial!</h1>
    </div>
  );
}

export default Home;
