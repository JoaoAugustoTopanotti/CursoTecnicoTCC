import React, { useState, useEffect } from 'react';
import { db } from '../components/firebaseConfig';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, differenceInMinutes, isToday } from 'date-fns';
import styles from './VisualizarAgenda.module.css'; // Importa o arquivo CSS

// Componente VisualizarAgenda
const VisualizarAgenda = () => {
  const [, setAgendamentos] = useState([]);
  const [agendamentosPendentes, setAgendamentosPendentes] = useState([]);
  const [agendamentosFinalizados, setAgendamentosFinalizados] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      setLoading(true);
      try {
        const agendamentosQuery = query(
          collection(db, 'Agendamentos'),
          orderBy('DataHora', 'asc')
        );
        const querySnapshot = await getDocs(agendamentosQuery);
        const agendamentosData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Busca o documento do pet
          const petDocRef = doc(db, 'Pets', data.PetID);
          const petDocSnap = await getDoc(petDocRef);
          const petData = petDocSnap.exists() ? petDocSnap.data() : { Nome: 'Desconhecido' };
          
          // Busca o documento do usuário
          const userDocRef = doc(db, 'Usuario', data.UsuarioID);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : { login: 'Desconhecido' };

          return {
            id: docSnap.id,
            ...data,
            PetNome: petData.Nome,
            UsuarioNome: userData.login,
          };
        }));

        const agora = new Date();

        // Atualiza agendamentos pendentes que já passaram do horário
        const updatedAgendamentos = await Promise.all(agendamentosData.map(async (agendamento) => {
          const dataHora = agendamento.DataHora.toDate();
          if (agendamento.Status === 'Pendente' && dataHora <= agora) {
            const agendamentoRef = doc(db, 'Agendamentos', agendamento.id);
            await updateDoc(agendamentoRef, { Status: 'Finalizado' });
            agendamento.Status = 'Finalizado'; // Atualiza localmente
          }
          return agendamento;
        }));

        setAgendamentos(updatedAgendamentos);

        // Filtra os agendamentos pendentes e finalizados
        setAgendamentosPendentes(
          updatedAgendamentos.filter(agendamento =>
            agendamento.Status === 'Pendente'
          )
        );
        setAgendamentosFinalizados(
          updatedAgendamentos.filter(agendamento =>
            agendamento.Status === 'Finalizado'
          )
        );

        // Calcula o próximo agendamento
        const próxima = updatedAgendamentos
          .filter(agendamento => agendamento.Status === 'Pendente')
          .reduce((acc, agendamento) => {
            const dataHora = agendamento.DataHora.toDate();
            const diff = dataHora - agora;
            return (diff < acc.diff && diff >= 0) ? { agendamento, diff } : acc;
          }, { agendamento: null, diff: Infinity });

        setNextAppointment(próxima.agendamento);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentos();
  }, []);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    try {
      if (isToday(date)) {
        // Se a data selecionada for hoje, exibe todos os agendamentos
        const agendamentosQuery = query(
          collection(db, 'Agendamentos'),
          orderBy('DataHora', 'asc')
        );
        const querySnapshot = await getDocs(agendamentosQuery);
        const agendamentosData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Busca o documento do pet
          const petDocRef = doc(db, 'Pets', data.PetID);
          const petDocSnap = await getDoc(petDocRef);
          const petData = petDocSnap.exists() ? petDocSnap.data() : { Nome: 'Desconhecido' };
          
          // Busca o documento do usuário
          const userDocRef = doc(db, 'Usuario', data.UsuarioID);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : { login: 'Desconhecido' };

          return {
            id: docSnap.id,
            ...data,
            PetNome: petData.Nome,
            UsuarioNome: userData.login,
          };
        }));

        // Atualiza a lista com todos os agendamentos
        const agora = new Date();
        const updatedAgendamentos = await Promise.all(agendamentosData.map(async (agendamento) => {
          const dataHora = agendamento.DataHora.toDate();
          if (agendamento.Status === 'Pendente' && dataHora <= agora) {
            const agendamentoRef = doc(db, 'Agendamentos', agendamento.id);
            await updateDoc(agendamentoRef, { Status: 'Finalizado' });
            agendamento.Status = 'Finalizado'; // Atualiza localmente
          }
          return agendamento;
        }));

        setAgendamentos(updatedAgendamentos);
        setAgendamentosPendentes(
          updatedAgendamentos.filter(agendamento =>
            agendamento.Status === 'Pendente'
          )
        );
        setAgendamentosFinalizados(
          updatedAgendamentos.filter(agendamento =>
            agendamento.Status === 'Finalizado'
          )
        );
      } else {
        // Se a data selecionada não for hoje, exibe apenas os agendamentos para essa data
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const filteredQuery = query(
          collection(db, 'Agendamentos'),
          where('DataHora', '>=', startOfDay),
          where('DataHora', '<=', endOfDay),
          orderBy('DataHora', 'asc')
        );
        const querySnapshot = await getDocs(filteredQuery);
        const filteredData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Busca o documento do pet
          const petDocRef = doc(db, 'Pets', data.PetID);
          const petDocSnap = await getDoc(petDocRef);
          const petData = petDocSnap.exists() ? petDocSnap.data() : { Nome: 'Desconhecido' };
          
          // Busca o documento do usuário
          const userDocRef = doc(db, 'Usuario', data.UsuarioID);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : { login: 'Desconhecido' };

          return {
            id: docSnap.id,
            ...data,
            PetNome: petData.Nome,
            UsuarioNome: userData.login,
          };
        }));

        // Atualiza a lista com os agendamentos do dia selecionado
        const agendamentosPendentes = filteredData.filter(agendamento => agendamento.Status === 'Pendente');
        const agendamentosFinalizados = filteredData.filter(agendamento => agendamento.Status === 'Finalizado');

        setAgendamentosPendentes(agendamentosPendentes);
        setAgendamentosFinalizados(agendamentosFinalizados);
      }
    } catch (error) {
      console.error('Erro ao buscar dados filtrados:', error);
    }
  };

  const calcularTempoRestante = (dataHora) => {
    const agora = new Date();
    const minutosRestantes = differenceInMinutes(dataHora.toDate(), agora);
    
    if (minutosRestantes <= 0) return 'Tempo esgotado';
    
    const horasRestantes = Math.floor(minutosRestantes / 60);
    const minutos = minutosRestantes % 60;
    
    return `${horasRestantes}h ${minutos}m restantes`;
  };

  return (
    <div className={styles.visualizarAgenda}>
      <h1>Visualizar Agenda</h1>
      {nextAppointment && (
        <div className={styles.notification}>
          Próximo atendimento daqui a {Math.ceil((nextAppointment.DataHora.toDate() - new Date()) / (1000 * 60 * 60))} horas.
        </div>
      )}
      <div className={styles.datePickerContainer}>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          className={styles.datePicker}
        />
      </div>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <h2>Agendamentos Pendentes</h2>
          <table className={styles.agendamentosTable}>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Nome do Pet</th>
                <th>Nome do Usuário</th>
                <th>Tipo de Pelagem</th>
                <th>Valor</th>
                <th>Tempo Restante</th>
              </tr>
            </thead>
            <tbody>
              {agendamentosPendentes.map((agendamento) => (
                <tr key={agendamento.id}>
                  <td>{format(agendamento.DataHora.toDate(), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{agendamento.PetNome}</td>
                  <td>{agendamento.UsuarioNome}</td>
                  <td>{agendamento.TipoPelagem}</td>
                  <td>{`R$ ${agendamento.Valor.toFixed(2)}`}</td>
                  <td>{calcularTempoRestante(agendamento.DataHora)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Agendamentos Finalizados</h2>
          <table className={styles.agendamentosTable}>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Nome do Pet</th>
                <th>Nome do Usuário</th>
                <th>Tipo de Pelagem</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {agendamentosFinalizados.map((agendamento) => (
                <tr key={agendamento.id}>
                  <td>{format(agendamento.DataHora.toDate(), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{agendamento.PetNome}</td>
                  <td>{agendamento.UsuarioNome}</td>
                  <td>{agendamento.TipoPelagem}</td>
                  <td>{`R$ ${agendamento.Valor.toFixed(2)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default VisualizarAgenda;
