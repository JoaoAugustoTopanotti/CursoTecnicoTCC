// Feedback centralizado ao usuário.
// Antes o projeto tratava erros de 3 formas diferentes (console.error, alert e
// toast). Aqui padronizamos tudo em toast, com a mesma configuração visual.

import { toast } from 'react-toastify'
import { TOAST_PADRAO } from '../constants'

export function notificarSucesso(mensagem) {
  toast.success(mensagem, TOAST_PADRAO)
}

export function notificarErro(mensagem) {
  toast.error(mensagem, TOAST_PADRAO)
}
