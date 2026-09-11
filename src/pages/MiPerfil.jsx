import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import CapturaFirma from '../components/CapturaFirma.jsx';

export default function MiPerfil() {
  const { perfil } = useAuth();
  const [editandoFirma, setEditandoFirma] = useState(false);

  return (
    <div>
      <h1>Mi perfil</h1>
      <div className="tarjeta" style={{ maxWidth: 480 }}>
        <p><strong>Nombre:</strong> {perfil.nombre}</p>
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
    </div>
  );
}
