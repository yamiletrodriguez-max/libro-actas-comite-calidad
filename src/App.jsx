import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import PanelAdmin from './pages/PanelAdmin.jsx';
import PanelDocente from './pages/PanelDocente.jsx';
import EditorActa from './pages/EditorActa.jsx';
import DetalleActa from './pages/DetalleActa.jsx';
import MiPerfil from './pages/MiPerfil.jsx';
import Header from './components/Header.jsx';

function Cargando() {
  return <div style={{ padding: '3em', textAlign: 'center' }}>Cargando…</div>;
}

function RutaPrivada({ rolesPermitidos, children }) {
  const { usuario, perfil, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario || !perfil) return <Navigate to="/" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(perfil.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { usuario, perfil, cargando } = useAuth();

  if (cargando) return <Cargando />;

  return (
    <div className="shell">
      {usuario && perfil && <Header />}
      <div className={usuario && perfil ? 'contenido' : ''}>
        <Routes>
          <Route
            path="/"
            element={
              !usuario || !perfil ? (
                <Login />
              ) : perfil.rol === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/docente" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              <RutaPrivada rolesPermitidos={['admin']}>
                <PanelAdmin />
              </RutaPrivada>
            }
          />
          <Route
            path="/admin/nueva-acta"
            element={
              <RutaPrivada rolesPermitidos={['admin']}>
                <EditorActa />
              </RutaPrivada>
            }
          />
          <Route
            path="/admin/acta/:id/editar"
            element={
              <RutaPrivada rolesPermitidos={['admin']}>
                <EditorActa />
              </RutaPrivada>
            }
          />
          <Route
            path="/docente"
            element={
              <RutaPrivada rolesPermitidos={['docente', 'admin']}>
                <PanelDocente />
              </RutaPrivada>
            }
          />
          <Route
            path="/acta/:id"
            element={
              <RutaPrivada rolesPermitidos={['admin', 'docente']}>
                <DetalleActa />
              </RutaPrivada>
            }
          />
          <Route
            path="/mi-perfil"
            element={
              <RutaPrivada rolesPermitidos={['admin', 'docente']}>
                <MiPerfil />
              </RutaPrivada>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
