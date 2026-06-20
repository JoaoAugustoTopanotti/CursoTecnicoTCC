// Centraliza a navegação e o padrão "se logado vá para X, senão vá para o login",
// que antes estava copiado 12 vezes pelas páginas.

import { useRouter } from 'next/router'
import { useAuth } from '../components/authContext'
import { ROTAS } from '../constants'

export function useNavegacao() {
  const router = useRouter()
  const { currentUser } = useAuth()

  const irPara = rota => router.push(rota)

  // Vai para a rota se houver usuário logado; caso contrário, manda para o login.
  const irParaSeAutenticado = rota =>
    router.push(currentUser ? rota : ROTAS.LOGIN)

  return {
    irPara,
    irParaSeAutenticado,
    irParaHome: () => irPara(ROTAS.HOME),
    irParaAgendamento: () => irParaSeAutenticado(ROTAS.AGENDAMENTO),
    irParaCarrinho: () => irParaSeAutenticado(ROTAS.CARRINHO),
    irParaProduto: id => irParaSeAutenticado(ROTAS.produto(id)),
  }
}
