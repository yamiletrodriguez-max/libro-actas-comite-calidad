import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';

// Muestra la lista de usuarios (docentes + admin) del comité para que el
// administrador marque quiénes participaron en la reunión.
export default function SelectorParticipantes({ seleccionados, alCambiar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const q = query(collection(db, 'usuarios'), orderBy('nombre'));
      const snap = await getDocs(q);
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }
    cargar();
  }, []);

  function alternar(u) {
    const yaEsta = seleccionados.some((s) => s.uid === u.id);
    if (yaEsta) {
      alCambiar(seleccionados.filter((s) => s.uid !== u.id));
    } else {
      alCambiar([
        ...seleccionados,
        { uid: u.id, nombre: u.nombre || '', cargo: u.cargo || '', firmado: false, firmaURL: null, fechaFirma: null },
      ]);
    }
  }

  if (cargando) return <p>Cargando integrantes…</p>;

  return (
    <div className="participantes-lista">
      {usuarios.map((u) => {
        const marcado = seleccionados.some((s) => s.uid === u.id);
        return (
          <label key={u.id} className="participante-item" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={marcado} onChange={() => alternar(u)} style={{ width: 'auto' }} />
            <div>
              <strong>{u.nombre}</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--tinta-suave)' }}>{u.cargo || u.rol}</div>
            </div>
          </label>
        );
      })}
      {usuarios.length === 0 && (
        <p style={{ color: 'var(--tinta-suave)' }}>
          Aún no hay integrantes registrados. Créalos primero en "Gestionar usuarios".
        </p>
      )}
    </div>
  );
}
