import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

const ETIQUETA = {
  borrador: { texto: 'Borrador', clase: 'borrador' },
  pendiente_firmas: { texto: 'Pendiente de firmas', clase: 'pendiente' },
  completa: { texto: 'Completa', clase: 'completa' },
};

export default function PanelAdmin() {
  const { perfil } = useAuth();
  const [actas, setActas] = useState([]);
  const [pestana, setPestana] = useState('actas');
  const [borrandoId, setBorrandoId] = useState(null);
  const [errorBorrar, setErrorBorrar] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'actas'), orderBy('creadoEn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setActas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const totalActas = actas.length;
  const pendientes = actas.filter((a) => a.estado === 'pendiente_firmas').length;
  const completas = actas.filter((a) => a.estado === 'completa').length;
  const borradores = actas.filter((a) => a.estado === 'borrador').length;

  const pendientesDeMiFirma = actas.filter(
    (a) =>
      a.estado === 'pendiente_firmas' &&
      (a.participantes || []).some((p) => p.uid === perfil.id && !p.firmado)
  );

  // Todas las actas que todavía esperan la firma de alguien (de todo el
  // comité, no solo de quien está viendo el panel).
  const todasLasPendientes = actas.filter((a) => a.estado === 'pendiente_firmas');

  async function borrarActa(e, acta) {
    // Evita que el clic active el <Link> que abre el acta.
    e.preventDefault();
    e.stopPropagation();
    const confirmado = window.confirm(
      `¿Borrar el acta No. ${acta.numero} — "${acta.titulo}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;
    setErrorBorrar('');
    setBorrandoId(acta.id);
    try {
      await deleteDoc(doc(db, 'actas', acta.id));
    } catch (err) {
      setErrorBorrar('No se pudo borrar el acta. Intenta de nuevo.');
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <div>
      <h1>Libro de Actas — Comité de Calidad</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-numero">{totalActas}</span>
          <span className="stat-etiqueta">Actas totales</span>
        </div>
        <div className="stat-card stat-card--oro">
          <span className="stat-numero">{pendientes}</span>
          <span className="stat-etiqueta">Pendientes de firma</span>
        </div>
        <div className="stat-card stat-card--verde">
          <span className="stat-numero">{completas}</span>
          <span className="stat-etiqueta">Completas</span>
        </div>
        <div className="stat-card">
          <span className="stat-numero">{borradores}</span>
          <span className="stat-etiqueta">Borradores</span>
        </div>
      </div>

      <div className="accesos-rapidos">
        <Link to="/admin/nueva-acta">
          <button className="btn-oro">+ Nueva acta</button>
        </Link>
      </div>

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

      <div className="pestanas">
        <button className={pestana === 'actas' ? 'activa' : ''} onClick={() => setPestana('actas')}>
          Actas
        </button>
        <button className={pestana === 'firmas' ? 'activa' : ''} onClick={() => setPestana('firmas')}>
          Firmas pendientes {todasLasPendientes.length > 0 && `(${todasLasPendientes.length})`}
        </button>
        <button className={pestana === 'usuarios' ? 'activa' : ''} onClick={() => setPestana('usuarios')}>
          Gestionar usuarios
        </button>
      </div>

      {pestana === 'actas' && (
        <>
          {errorBorrar && <div className="mensaje-error">{errorBorrar}</div>}
          <div className="lista-actas">
            {actas.map((a) => (
              <div key={a.id} className="fila-acta">
                <Link
                  to={a.estado === 'borrador' ? `/admin/acta/${a.id}/editar` : `/acta/${a.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1em', flex: 1, minWidth: 0 }}
                >
                  <div className="num">{a.numero}</div>
                  <div className="info">
                    <h4>{a.titulo}</h4>
                    <p>{a.fecha} · {a.lugar}</p>
                  </div>
                  <span className={`etiqueta ${ETIQUETA[a.estado]?.clase}`}>
                    {ETIQUETA[a.estado]?.texto}
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn-danger btn-borrar-acta"
                  onClick={(e) => borrarActa(e, a)}
                  disabled={borrandoId === a.id}
                  title="Borrar esta acta"
                >
                  {borrandoId === a.id ? 'Borrando…' : 'Borrar'}
                </button>
              </div>
            ))}
            {actas.length === 0 && (
              <p style={{ color: 'var(--tinta-suave)' }}>Todavía no se ha registrado ninguna acta.</p>
            )}
          </div>
        </>
      )}

      {pestana === 'firmas' && (
        <div className="lista-actas">
          {todasLasPendientes.map((a) => {
            const faltantes = (a.participantes || []).filter((p) => !p.firmado);
            const yaFirmaron = (a.participantes || []).filter((p) => p.firmado);
            const meFaltaAmi = faltantes.some((p) => p.uid === perfil.id);
            return (
              <div key={a.id} className="tarjeta" style={{ marginBottom: '0.8em' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1em' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Acta {a.numero} — {a.titulo}</h4>
                    <p style={{ margin: '0.2em 0', color: 'var(--tinta-suave)' }}>{a.fecha} · {a.lugar}</p>
                  </div>
                  <Link to={`/acta/${a.id}`}>
                    <button className={meFaltaAmi ? 'btn-oro' : 'btn-outline'}>
                      {meFaltaAmi ? 'Firmar' : 'Ver acta'}
                    </button>
                  </Link>
                </div>
                <p style={{ marginTop: '0.6em', marginBottom: '0.3em' }}>
                  <strong>Falta la firma de:</strong>{' '}
                  {faltantes.length > 0
                    ? faltantes.map((p) => p.nombre).join(', ')
                    : 'nadie (a punto de completarse)'}
                </p>
                {yaFirmaron.length > 0 && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--tinta-suave)' }}>
                    Ya firmaron: {yaFirmaron.map((p) => p.nombre).join(', ')}
                  </p>
                )}
              </div>
            );
          })}
          {todasLasPendientes.length === 0 && (
            <p style={{ color: 'var(--tinta-suave)' }}>No hay actas pendientes de firma en este momento.</p>
          )}
        </div>
      )}

      {pestana === 'usuarios' && <GestionUsuarios />}
    </div>
  );
}

function GestionUsuarios() {
  const { usuario } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('docente');
  const [cargo, setCargo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crearUsuario(e) {
    e.preventDefault();
    setMensaje('');
    setError('');
    setEnviando(true);
    try {
      const token = await usuario.getIdToken();
      const resp = await fetch('/.netlify/functions/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, password, rol, cargo }),
      });
      const datos = await resp.json();
      if (!resp.ok) throw new Error(datos.error || 'Error al crear usuario');
      setMensaje(`Cuenta creada para ${nombre}. Comparte el correo y la contraseña temporal.`);
      setNombre(''); setEmail(''); setPassword(''); setCargo('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 480 }}>
      <h3>Crear integrante del comité</h3>
      {mensaje && <div className="mensaje-ok">{mensaje}</div>}
      {error && <div className="mensaje-error">{error}</div>}
      <form onSubmit={crearUsuario}>
        <div className="campo">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Contraseña temporal</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="grid-2">
          <div className="campo">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="docente">Docente / integrante</option>
              <option value="admin">Administración</option>
            </select>
          </div>
          <div className="campo">
            <label>Cargo (opcional)</label>
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej. Coordinadora académica" />
          </div>
        </div>
        <button className="btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
