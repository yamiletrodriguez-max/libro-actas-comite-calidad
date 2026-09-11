// Configuración de Firebase.
// Reemplaza estos valores con los de tu propio proyecto Firebase
// (Firebase Console -> Configuración del proyecto -> Tus apps -> SDK config).
// Puedes copiar estos valores a un archivo .env y leerlos con import.meta.env
// si prefieres no dejarlos escritos directamente aquí.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'TU_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tu-proyecto.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tu-proyecto',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tu-proyecto.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:xxxxxxxxxxxxx',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Nota: esta plataforma no usa Firebase Storage (requiere plan Blaze/tarjeta).
// Las firmas y los PDFs se generan y guardan como texto (base64) en Firestore,
// que es gratis sin necesidad de tarjeta.
