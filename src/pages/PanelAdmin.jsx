import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

const ETIQUETA = {
  borrador: { texto: 'Borrador', clase: 'borrador' },
  pendiente_firmas: { texto: 'Pendiente de firmas', clase: 'pendiente' },
  completa: { texto: 'Completa', clase: 'completa' },
};

export default function PanelAdmin() {
  const [actas, setActas] = useState([]);
  const [pestana, setPestana] = useState('actas');

  useEffect(() => {
    const q = query(collection(db, 'actas'), orderBy('creadoEn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setActas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return (
    <div>
      <h1>Libro de Actas — Comité de Calidad</h1>
      <div className="pestanas">
        <button className={pestana === 'actas' ? 'activa' : ''} onClick={() => setPestana('actas')}>
          Actas
        </button>
        <button className={pestana === 'usuarios' ? 'activa' : ''} onClick={() => setPestana('usuarios')}>
          Gestionar usuarios
        </button>
      </div>

      {pestana === 'actas' && (
        <>
          <div style={{ marginBottom: '1.2em' }}>
            <Link to="/admin/nueva-acta">
              <button className="btn-oro">+ Nueva acta</button>
            </Link>
          </div>
          <div className="lista-actas">
            {actas.map((a) => (
              <Link key={a.id} to={a.estado === 'borrador' ? `/admin/acta/${a.id}/editar` : `/acta/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fila-acta">
                  <div className="num">{a.numero}</div>
                  <div className="info">
                    <h4>{a.titulo}</h4>
                    <p>{a.fecha} · {a.lugar}</p>
                  </div>
                  <span className={`etiqueta ${ETIQUETA[a.estado]?.clase}`}>
                    {ETIQUETA[a.estado]?.texto}
                  </span>
                </div>
              </Link>
            ))}
            {actas.length === 0 && (
              <p style={{ color: 'var(--tinta-suave)' }}>Todavía no se ha registrado ninguna acta.</p>
            )}
          </div>
        </>
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
