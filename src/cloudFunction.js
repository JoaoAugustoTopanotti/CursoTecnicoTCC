const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

admin.initializeApp()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

exports.sendEmailNotification = functions.firestore
  .document('Agendamentos/{agendamentoId}')
  .onCreate(async snap => {
    const agendamento = snap.data()

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GERENTE_EMAIL,
      subject: 'Novo Agendamento de Banho e Tosa',
      text: `Novo agendamento recebido:\n
             Pet ID: ${agendamento.PetID}\n
             Usuário ID: ${agendamento.UsuarioID}\n
             Data e Hora: ${agendamento.DataHora.toDate()}\n
             Valor: ${agendamento.Valor}\n
             Tipo de Pelagem: ${agendamento.TipoPelagem}`,
    }

    try {
      await transporter.sendMail(mailOptions)
    } catch (error) {
      console.error('Erro ao enviar notificação de agendamento:', error)
    }
  })
