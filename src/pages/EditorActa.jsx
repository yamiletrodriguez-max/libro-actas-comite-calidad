import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import SelectorParticipantes from '../components/SelectorParticipantes.jsx';
import CapturaEvidencias from '../components/CapturaEvidencias.jsx';
import { mejorarRedaccion } from '../utils/mejorarTexto.js';

export default function EditorActa() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { perfil } = useAuth();

  const [numero, setNumero] = useState('');
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [agenda, setAgenda] = useState('');
  const [desarrollo, setDesarrollo] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [participantes, setParticipantes] = useState([]);
  const [evidencias, setEvidencias] = useState([]);

  const [mejorando, setMejorando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'actas', id)).then((snap) => {
      if (!snap.exists()) return;
      const a = snap.data();
      setNumero(a.numero || '');
      setTitulo(a.titulo || '');
      setFecha(a.fecha || '');
      setLugar(a.lugar || '');
      setAgenda(a.agenda || '');
      setDesarrollo(a.desarrollo || '');
      setAcuerdos(a.acuerdos || '');
      setParticipantes(a.participantes || []);
      setEvidencias(a.evidencias || []);
    });
  }, [id]);

  async function mejorarConIA() {
    if (!desarrollo.trim()) return;
    setMejorando(true);
    setError('');
    try {
      const mejorado = await mejorarRedaccion(desarrollo, `${titulo} — agenda: ${agenda}`);
      setDesarrollo(mejorado);
    } catch (e) {
      setError('No se pudo mejorar el texto. Puedes seguir editando manualmente.');
    } finally {
      setMejorando(false);
    }
  }

  async function guardarBorrador() {
    setGuardando(true);
    setError('');
    try {
      const datosActa = {
        numero, titulo, fecha, lugar, agenda, desarrollo, acuerdos, participantes, evidencias,
        estado: 'borrador',
        actualizadoEn: serverTimestamp(),
      };
      if (id) {
        await updateDoc(doc(db, 'actas', id), datosActa);
        navegar('/admin');
      } else {
        await addDoc(collection(db, 'actas'), {
          ...datosActa,
          creadoPor: perfil.id,
          creadoEn: serverTimestamp(),
        });
        navegar('/admin');
      }
    } catch (e) {
      setError('No se pudo guardar el acta.');
    } finally {
      setGuardando(false);
    }
  }

  async function publicarParaFirmas() {
    if (participantes.length === 0) {
      setError('Selecciona al menos un participante antes de publicar.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const datosActa = {
        numero, titulo, fecha, lugar, agenda, desarrollo, acuerdos, participantes, evidencias,
        estado: 'pendiente_firmas',
        actualizadoEn: serverTimestamp(),
      };
      if (id) {
        await updateDoc(doc(db, 'actas', id), datosActa);
      } else {
        await addDoc(collection(db, 'actas'), {
          ...datosActa,
          creadoPor: perfil.id,
          creadoEn: serverTimestamp(),
        });
      }
      navegar('/admin');
    } catch (e) {
      setError('No se pudo publicar el acta para firmas.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <h1>{id ? 'Editar acta' : 'Nueva acta'}</h1>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="tarjeta">
        <div className="grid-2">
          <div className="campo">
            <label>Número de acta</label>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej. 004-2026" />
          </div>
          <div className="campo">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label>Título de la reunión</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Revisión de indicadores del segundo corte" />
        </div>
        <div className="campo">
          <label>Lugar</label>
          <input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Ej. Sala de reuniones, edificio administrativo" />
        </div>
        <div className="campo">
          <label>Agenda (un punto por línea)</label>
          <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} />
        </div>
        <div className="campo">
          <label>Desarrollo de la reunión</label>
          <textarea
            rows={8}
            value={desarrollo}
            onChange={(e) => setDesarrollo(e.target.value)}
            placeholder="Escribe lo discutido tal como lo anotaste en la reunión. La IA puede ayudarte a mejorar la redacción."
          />
          <button type="button" className="btn-outline" onClick={mejorarConIA} disabled={mejorando || !desarrollo.trim()} style={{ marginTop: '0.5em' }}>
            {mejorando ? 'Mejorando redacción…' : '✎ Mejorar redacción con IA'}
          </button>
          <p className="ayuda-ia">La IA solo mejora la forma del texto; no inventa acuerdos ni datos nuevos. Revisa siempre el resultado.</p>
        </div>
        <div className="campo">
          <label>Acuerdos y compromisos</label>
          <textarea value={acuerdos} onChange={(e) => setAcuerdos(e.target.value)} />
        </div>
      </div>

      <div className="tarjeta">
        <h3>Participantes de la reunión</h3>
        <SelectorParticipantes seleccionados={participantes} alCambiar={setParticipantes} />
      </div>

      <div className="tarjeta">
        <h3>Evidencia fotográfica</h3>
        <CapturaEvidencias evidencias={evidencias} alCambiar={setEvidencias} />
      </div>

      <div style={{ display: 'flex', gap: '0.8em' }}>
        <button className="btn-outline" onClick={guardarBorrador} disabled={guardando}>
          Guardar borrador
        </button>
        <button className="btn-oro" onClick={publicarParaFirmas} disabled={guardando}>
          Publicar y solicitar firmas
        </button>
      </div>
    </div>
  );
}
