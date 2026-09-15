import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ENLACE_EVIDENCIAS_PRECE =
  'https://drive.google.com/drive/folders/1iPu7WQWdhY0NAfpq_gffNiMCot6l8WSx?usp=drive_link';
const ENLACE_EVIDENCIAS_PRECE_EMBED =
  'https://drive.google.com/embeddedfolderview?id=1iPu7WQWdhY0NAfpq_gffNiMCot6l8WSx#list';

function ModalEvidenciasPrece({ onCerrar }) {
  return (
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '900px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e2e2',
          }}
        >
          <strong>Evidencias · Premio PRECE a la calidad</strong>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={ENLACE_EVIDENCIAS_PRECE}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              Abrir en Drive
            </a>
            <button className="btn-outline" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
        <iframe
          src={ENLACE_EVIDENCIAS_PRECE_EMBED}
          title="Evidencias del premio PRECE a la calidad"
          style={{ border: 'none', flex: 1, width: '100%' }}
        />
      </div>
    </div>
  );
}

export default function Header() {
  const { perfil, cerrarSesion } = useAuth();
  const [mostrarEvidenciasPrece, setMostrarEvidenciasPrece] = useState(false);

  return (
    <div className="topbar">
      <img src="/logo.png" alt="Logo del Politécnico" className="logo" />
      <div className="titulo-inst">
        Libro de Actas · Comité de Calidad
        <small>Politécnico y Centro Educativo Padre Luis Variara</small>
      </div>
      <div className="espaciador" />
      <button
        className="btn-outline"
        style={{ color: '#fff', borderColor: '#3a597a', marginRight: '10px' }}
        title="Evidencias del premio PRECE a la calidad"
        onClick={() => setMostrarEvidenciasPrece(true)}
      >
        Evidencias PRECE
      </button>
      {mostrarEvidenciasPrece && (
        <ModalEvidenciasPrece onCerrar={() => setMostrarEvidenciasPrece(false)} />
      )}
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
