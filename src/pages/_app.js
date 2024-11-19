<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthProvider } from '../components/authContext'
=======
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../components/authContext';
import '../pages/globals.css'
>>>>>>> 410537d0b041dfeaa840ddf117886ea4a00a6103
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
