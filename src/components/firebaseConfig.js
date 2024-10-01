// src/pages/FirebaseConfig.js
import React from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Importa apenas getFirestore
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAkYdqiTG7T9amg02X-P4HQB-mEdvQBVY8",
  authDomain: "agroshop-tramontin-fd79e.firebaseapp.com",
  projectId: "agroshop-tramontin-fd79e",
  storageBucket: "agroshop-tramontin-fd79e.appspot.com",
  messagingSenderId: "608819980326",
  appId: "1:608819980326:web:ed90c473cffb9b2672dee7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Sessão persistente configurada.");
  })
  .catch((error) => {
    console.error("Erro ao configurar a persistência:", error);
  });

export { db, auth };
