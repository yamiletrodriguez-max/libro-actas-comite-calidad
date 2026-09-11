import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PanelDocente() {
  const { perfil } = useAuth();
  const [actas, setActas] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'actas'), orderBy('creadoEn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setActas(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.estado !== 'borrador'));
    });
    return unsub;
  }, []);

  const misActas = actas.filter((a) => (a.participantes || []).some((p) => p.uid === perfil.id));
  const pendientesDeMiFirma = misActas.filter(
    (a) => a.estado === 'pendiente_firmas' && a.participantes.some((p) => p.uid === perfil.id && !p.firmado)
  );
  const resto = misActas.filter((a) => !pendientesDeMiFirma.includes(a));

  return (
    <div>
      <h1>Mis actas — Comité de Calidad</h1>

      {pendientesDeMiFirma.length > 0 && (
        <div className="tarjeta" style={{ borderColor: 'var(--oro-400)' }}>
          <h3>Pendientes de tu firma</h3>
          <div className="lista-actas">
            {pendientesDeMiFirma.map((a) => (
              <Link key={a.id} to={`/acta/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fila-acta">
                  <div className="num">{a.numero}</div>
                  <div className="info">
                    <h4>{a.titulo}</h4>
                    <p>{a.fecha} · {a.lugar}</p>
                  </div>
                  <span className="etiqueta pendiente">Requiere tu firma</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="tarjeta">
        <h3>Historial</h3>
        <div className="lista-actas">
          {resto.map((a) => (
            <Link key={a.id} to={`/acta/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="fila-acta">
                <div className="num">{a.numero}</div>
                <div className="info">
                  <h4>{a.titulo}</h4>
                  <p>{a.fecha} · {a.lugar}</p>
                </div>
                <span className={`etiqueta ${a.estado === 'completa' ? 'completa' : 'pendiente'}`}>
                  {a.estado === 'completa' ? 'Completa' : 'Pendiente'}
                </span>
              </div>
            </Link>
          ))}
          {resto.length === 0 && pendientesDeMiFirma.length === 0 && (
            <p style={{ color: 'var(--tinta-suave)' }}>Todavía no apareces como participante en ninguna acta.</p>
          )}
        </div>
      </div>
    </div>
  );
}
