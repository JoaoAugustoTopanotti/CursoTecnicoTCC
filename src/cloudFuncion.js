// cloudFunction.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joaoaugustoact@gmail.com',
    pass: 'Jactopa2007'
  }
});

exports.sendEmailNotification = functions.firestore
  .document('Agendamentos/{agendamentoId}')
  .onCreate(async (snap, context) => {
    const agendamento = snap.data();

    const mailOptions = {
      from: 'joaoaugustoact@gmail.com',
      to: 'joaoactopa@gmail.com',
      subject: 'Novo Agendamento de Banho e Tosa',
      text: `Novo agendamento recebido:\n\n
             Pet ID: ${agendamento.PetID}\n
             Usuário ID: ${agendamento.UsuarioID}\n
             Data e Hora: ${agendamento.DataHora.toDate()}\n
             Valor: ${agendamento.Valor}\n
             Tipo de Pelagem: ${agendamento.TipoPelagem}`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Notificação enviada para o gerente!');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  });
