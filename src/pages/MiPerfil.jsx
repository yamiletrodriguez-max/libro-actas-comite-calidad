import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import CapturaFirma from '../components/CapturaFirma.jsx';

export default function MiPerfil() {
  const { perfil, usuario, cambiarClave } = useAuth();
  const [editandoFirma, setEditandoFirma] = useState(false);

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
        <p><strong>Nombre:</strong> {perfil.nombre}</p>
        <p><strong>Correo:</strong> {usuario?.email}</p>
        <p><strong>Rol:</strong> {perfil.rol === 'admin' ? 'Administración' : 'Docente / integrante'}</p>
        {perfil.cargo && <p><strong>Cargo:</strong> {perfil.cargo}</p>}
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
