import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null); // datos de Firebase Auth
  const [perfil, setPerfil] = useState(null); // documento en /usuarios/{uid} (nombre, rol, firmaURL, cargo)
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUsuario(u);
      if (u) {
        const ref = doc(db, 'usuarios', u.uid);
        const snap = await getDoc(ref);
        setPerfil(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } else {
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  async function iniciarSesion(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function cerrarSesion() {
    await signOut(auth);
  }

  // Vuelve a leer el perfil (por ejemplo tras subir una firma por primera vez)
  async function recargarPerfil() {
    if (!usuario) return;
    const ref = doc(db, 'usuarios', usuario.uid);
    const snap = await getDoc(ref);
    setPerfil(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, perfil, cargando, iniciarSesion, cerrarSesion, recargarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
