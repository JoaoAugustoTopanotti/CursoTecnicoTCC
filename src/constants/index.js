// Constantes centrais do projeto.
// Resolve o code smell "Números e strings mágicos": em vez de valores soltos
// espalhados pelo código, cada número/string ganha um nome que explica sua intenção.

// Rotas da aplicação. Sempre começam com "/" para evitar a inconsistência
// que existia antes ('Autenticacao/login' sem barra x '/cart' com barra).
export const ROTAS = {
  HOME: '/',
  LOGIN: '/Autenticacao/login',
  AGENDAMENTO: '/agendamento',
  CARRINHO: '/cart',
  produto: id => `/produtos/${id}`,
}

// Taxa de entrega em reais (R$).
export const TAXA_ENTREGA = 10

// Valor adicional, em reais (R$), para "banho e tosa completo".
export const VALOR_TOSA_COMPLETA = 20

// Milissegundos em um dia (1000 ms * 60 s * 60 min * 24 h).
export const MS_POR_DIA = 1000 * 60 * 60 * 24

// Faixas (em dias) que definem a urgência da próxima vacinação do pet.
export const DIAS_VACINA = {
  URGENTE: 10, // até 10 dias -> vermelho
  PROXIMA: 20, // de 11 a 20 dias -> amarelo; acima disso -> verde
}

// Cores usadas nas notificações de vacina.
export const COR_VACINA = {
  URGENTE: 'red',
  PROXIMA: 'yellow',
  TRANQUILA: 'green',
}

// Configuração padrão dos toasts, para manter o feedback visual consistente.
export const TOAST_PADRAO = {
  position: 'top-center',
  autoClose: 2000,
}
