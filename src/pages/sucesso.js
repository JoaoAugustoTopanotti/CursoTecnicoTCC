import React from 'react'
import { useRouter } from 'next/router'
import style from "./sucesso.module.css"

const Sucesso = () => {
  const router = useRouter()
  const handleBackToMenu = () => {
    router.push('/')
  };

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1 className={style.title}>Pagamento realizado com sucesso!</h1>
        <p className={style.message}>Obrigado pela sua compra. Esperamos vê-lo novamente!</p>
        <button className={style.button} onClick={handleBackToMenu}>
          Voltar ao Menu Inicial
        </button>
      </div>
    </div>
  );
};

export default Sucesso
