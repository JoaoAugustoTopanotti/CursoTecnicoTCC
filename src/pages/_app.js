import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../components/authContext';
import '../pages/globals.css'
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
