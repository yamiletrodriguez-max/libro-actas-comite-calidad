import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { perfil, cerrarSesion } = useAuth();

  return (
    <div className="topbar">
      <img src="/logo.png" alt="Logo del Politécnico" className="logo" />
      <div className="titulo-inst">
        Libro de Actas · Comité de Calidad
        <small>Politécnico y Centro Educativo Padre Luis Variara</small>
      </div>
      <div className="espaciador" />
      <Link to="/mi-perfil" style={{ color: '#fff', textDecoration: 'none' }}>
        <div className="usuario">
          {perfil?.nombre}
          <span>{perfil?.rol === 'admin' ? 'Administración' : 'Docente'}</span>
        </div>
      </Link>
      <button className="btn-outline" style={{ color: '#fff', borderColor: '#3a597a' }} onClick={cerrarSesion}>
        Salir
      </button>
    </div>
  );
}
