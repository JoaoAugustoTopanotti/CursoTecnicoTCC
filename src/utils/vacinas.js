// Regras de domínio para a notificação de vacinação dos pets.
// Antes essa lógica estava duplicada (copiada/colada) em cart.js, index.js,
// agendamento.js e produtos/[id].js. Agora vive em um único lugar.

import { MS_POR_DIA, DIAS_VACINA, COR_VACINA } from '../constants'

// Quantos dias faltam até a próxima vacinação, a partir de um Timestamp do Firestore.
export function calcularDiasParaVacina(proximaVacinacao) {
  const dataVacina = proximaVacinacao.toDate()
  const hoje = new Date()
  return Math.ceil((dataVacina - hoje) / MS_POR_DIA)
}

// Cor da notificação conforme a urgência (quanto menos dias, mais urgente).
export function corDaNotificacao(diasRestantes) {
  if (diasRestantes <= DIAS_VACINA.URGENTE) return COR_VACINA.URGENTE
  if (diasRestantes <= DIAS_VACINA.PROXIMA) return COR_VACINA.PROXIMA
  return COR_VACINA.TRANQUILA
}

// Converte os documentos de "Pets" do Firestore em notificações prontas para a tela.
export function montarNotificacoesDeVacina(snapshotPets) {
  return snapshotPets.docs.map(documento => {
    const pet = documento.data()
    const diasRestantes = calcularDiasParaVacina(pet.PróximaVacinação)
    return {
      nomePet: pet.Nome,
      diasParaVacina: diasRestantes,
      cor: corDaNotificacao(diasRestantes),
    }
  })
}
