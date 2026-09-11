import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError('Correo o contraseña incorrectos. Verifica con la administración.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-caja">
      <img src="/logo.png" alt="Logo" className="logo-login" />
      <h2 style={{ textAlign: 'center' }}>Libro de Actas Digital</h2>
      <p style={{ textAlign: 'center', color: 'var(--tinta-suave)', marginTop: 0 }}>
        Comité de Calidad · Politécnico Padre Luis Variara
      </p>
      <div className="tarjeta">
        {error && <div className="mensaje-error">{error}</div>}
        <form onSubmit={manejarEnvio}>
          <div className="campo">
            <label>Correo institucional</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@variara.edu.do"
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={enviando} style={{ width: '100%' }}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--tinta-suave)', textAlign: 'center' }}>
        ¿No tienes cuenta? Solicítala a la administración del Comité de Calidad.
      </p>
    </div>
  );
}
