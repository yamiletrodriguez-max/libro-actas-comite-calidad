import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import CapturaFirma from '../components/CapturaFirma.jsx';

export default function MiPerfil() {
  const { perfil, usuario, cambiarClave, recargarPerfil } = useAuth();
  const [editandoFirma, setEditandoFirma] = useState(false);

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre || '');
  const [cargo, setCargo] = useState(perfil.cargo || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState('');
  const [okDatos, setOkDatos] = useState('');

  async function guardarDatos(e) {
    e.preventDefault();
    setErrorDatos('');
    setOkDatos('');
    if (!nombre.trim()) {
      setErrorDatos('El nombre no puede quedar vacío.');
      return;
    }
    setGuardandoDatos(true);
    try {
      const token = await usuario.getIdToken();
      const correoCambio = email.trim() !== (usuario?.email || '');
      const resp = await fetch('/.netlify/functions/actualizar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: perfil.id, nombre, cargo, email }),
      });
      const datos = await resp.json();
      if (!resp.ok) throw new Error(datos.error || 'No se pudieron guardar los cambios.');
      await recargarPerfil();
      setEditandoDatos(false);
      setOkDatos(
        correoCambio
          ? 'Datos actualizados. Como cambiaste tu correo, la próxima vez inicia sesión con el nuevo.'
          : 'Datos actualizados correctamente.'
      );
    } catch (err) {
      setErrorDatos(err.message);
    } finally {
      setGuardandoDatos(false);
    }
  }

  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState('');
  const [okClave, setOkClave] = useState('');

  async function manejarCambioClave(e) {
    e.preventDefault();
    setErrorClave('');
    setOkClave('');

    if (claveNueva.length < 6) {
      setErrorClave('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (claveNueva !== claveConfirmar) {
      setErrorClave('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setGuardandoClave(true);
    try {
      await cambiarClave(claveActual, claveNueva);
      setOkClave('Tu contraseña se actualizó correctamente.');
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorClave('La contraseña actual no es correcta.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorClave('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
      } else {
        setErrorClave('No se pudo cambiar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setGuardandoClave(false);
    }
  }

  return (
    <div>
      <h1>Mi perfil y configuración</h1>
      <div className="tarjeta" style={{ maxWidth: 480 }}>
        {okDatos && <div className="mensaje-ok">{okDatos}</div>}
        {!editandoDatos ? (
          <>
            <p><strong>Nombre:</strong> {perfil.nombre || <span style={{ color: 'var(--tinta-suave)' }}>(sin nombre guardado — complétalo)</span>}</p>
            <p><strong>Correo:</strong> {usuario?.email}</p>
            <p><strong>Rol:</strong> {perfil.rol === 'admin' ? 'Administración' : 'Docente / integrante'}</p>
            {perfil.cargo && <p><strong>Cargo:</strong> {perfil.cargo}</p>}
            <button className="btn-outline" onClick={() => setEditandoDatos(true)} style={{ marginTop: '0.5em' }}>
              Editar mi nombre, cargo o correo
            </button>
          </>
        ) : (
          <form onSubmit={guardarDatos}>
            <div className="campo">
              <label>Nombre completo</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="campo">
              <label>Cargo (opcional)</label>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej. Coordinadora académica" />
            </div>
            <div className="campo">
              <label>Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <p className="ayuda-ia">Si cambias tu correo, la próxima vez debes iniciar sesión con el nuevo.</p>
            </div>
            {errorDatos && <div className="mensaje-error">{errorDatos}</div>}
            <div style={{ display: 'flex', gap: '0.6em' }}>
              <button className="btn-primary" type="submit" disabled={guardandoDatos}>
                {guardandoDatos ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => { setEditandoDatos(false); setNombre(perfil.nombre || ''); setCargo(perfil.cargo || ''); setEmail(usuario?.email || ''); }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="tarjeta" style={{ maxWidth: 480 }}>
        <h3>Mi firma digital</h3>
        {perfil.firmaURL && !editandoFirma ? (
          <>
            <img src={perfil.firmaURL} alt="Tu firma" style={{ height: 60, marginBottom: '0.8em', display: 'block' }} />
            <button className="btn-outline" onClick={() => setEditandoFirma(true)}>
              Cambiar mi firma
            </button>
          </>
        ) : (
          <CapturaFirma alTerminar={() => setEditandoFirma(false)} />
        )}
        <p className="ayuda-ia">
          Esta firma se usará automáticamente cada vez que aceptes y firmes un acta del comité.
        </p>
      </div>

      <div className="tarjeta panel-config">
        <h3>Cambiar mi contraseña</h3>
        <form onSubmit={manejarCambioClave}>
          <div className="campo">
            <label>Contraseña actual</label>
            <input
              type="password"
              value={claveActual}
              onChange={(e) => setClaveActual(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="campo">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="campo">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={claveConfirmar}
              onChange={(e) => setClaveConfirmar(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {errorClave && <div className="mensaje-error">{errorClave}</div>}
          {okClave && <div className="mensaje-ok">{okClave}</div>}
          <button type="submit" className="btn-primary" disabled={guardandoClave}>
            {guardandoClave ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
