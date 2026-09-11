import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import CapturaFirma from '../components/CapturaFirma.jsx';
import { generarPDFActa } from '../utils/generarPDF.js';

export default function DetalleActa() {
  const { id } = useParams();
  const { perfil } = useAuth();
  const [acta, setActa] = useState(null);
  const [firmando, setFirmando] = useState(false);
  const [pidiendoFirma, setPidiendoFirma] = useState(false);
  const [error, setError] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'actas', id), (snap) => {
      setActa(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, [id]);

  if (!acta) return <p>Cargando acta…</p>;

  const miParticipacion = (acta.participantes || []).find((p) => p.uid === perfil.id);
  const todosFirmaron = (acta.participantes || []).length > 0 && acta.participantes.every((p) => p.firmado);

  async function firmarActa() {
    if (!miParticipacion) return;
    if (!perfil.firmaURL) {
      setPidiendoFirma(true);
      return;
    }
    setFirmando(true);
    setError('');
    try {
      const nuevosParticipantes = acta.participantes.map((p) =>
        p.uid === perfil.id
          ? { ...p, firmado: true, firmaURL: perfil.firmaURL, fechaFirma: new Date().toISOString() }
          : p
      );
      const yaCompleta = nuevosParticipantes.every((p) => p.firmado);
      await updateDoc(doc(db, 'actas', id), {
        participantes: nuevosParticipantes,
        estado: yaCompleta ? 'completa' : 'pendiente_firmas',
      });
    } catch (e) {
      setError('No se pudo registrar tu firma. Intenta de nuevo.');
    } finally {
      setFirmando(false);
    }
  }

  // El PDF se genera siempre al momento, en el navegador, a partir de los
  // datos guardados en Firestore (texto + firmas en base64) -- no se sube
  // a ningún lado, así que no hace falta Firebase Storage ni tarjeta.
  async function descargarPDF() {
    setGenerandoPDF(true);
    try {
      const blob = await generarPDFActa(acta, '/logo.png');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Acta-${acta.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('No se pudo generar el PDF.');
    } finally {
      setGenerandoPDF(false);
    }
  }

  return (
    <div>
      <Link to={perfil.rol === 'admin' ? '/admin' : '/docente'}>&larr; Volver al libro de actas</Link>

      <div className="tarjeta acta-vista" style={{ marginTop: '1em' }}>
        <div className="encabezado-doc">
          <img src="/logo.png" alt="Logo" />
          <h2>Acta No. {acta.numero} — {acta.titulo}</h2>
          <div className="meta-doc">
            <span>Fecha: {acta.fecha}</span>
            <span>Lugar: {acta.lugar}</span>
          </div>
        </div>

        {acta.agenda && (
          <>
            <h3>Agenda</h3>
            <p className="cuerpo-doc">{acta.agenda}</p>
          </>
        )}

        <h3>Desarrollo de la reunión</h3>
        <p className="cuerpo-doc">{acta.desarrollo}</p>

        {acta.acuerdos && (
          <>
            <h3>Acuerdos</h3>
            <p className="cuerpo-doc">{acta.acuerdos}</p>
          </>
        )}

        {acta.evidencias && acta.evidencias.length > 0 && (
          <>
            <h3>Evidencia fotográfica</h3>
            <div className="galeria-evidencias galeria-evidencias--vista">
              {acta.evidencias.map((src, i) => (
                <div key={i} className="miniatura-evidencia">
                  <img src={src} alt={`Evidencia ${i + 1} de la reunión`} />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="bloque-firmas">
          {(acta.participantes || []).map((p) => (
            <div key={p.uid} className="firma-cuadro">
              {p.firmado && p.firmaURL && <img src={p.firmaURL} alt={`Firma de ${p.nombre}`} />}
              <div className="linea">
                {p.nombre}
                <br />
                <span style={{ color: 'var(--tinta-suave)', fontWeight: 'normal' }}>
                  {p.firmado ? '✓ Firmado' : 'Pendiente de firma'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}

      {miParticipacion && !miParticipacion.firmado && acta.estado === 'pendiente_firmas' && (
        <div className="tarjeta">
          <h3>Tu firma</h3>
          {pidiendoFirma || !perfil.firmaURL ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--tinta-suave)' }}>
                Aún no tienes una firma guardada. Sube una foto de tu firma manuscrita una sola vez;
                se usará automáticamente en esta y futuras actas.
              </p>
              <CapturaFirma alTerminar={() => setPidiendoFirma(false)} />
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--tinta-suave)' }}>
                Al aceptar, confirmas que participaste en esta reunión y que tu firma digital
                guardada se incluirá automáticamente en el acta.
              </p>
              <img src={perfil.firmaURL} alt="Tu firma guardada" style={{ height: 50, marginBottom: '0.8em' }} />
              <div style={{ display: 'flex', gap: '0.8em' }}>
                <button className="btn-oro" onClick={firmarActa} disabled={firmando}>
                  {firmando ? 'Registrando…' : 'Aceptar y firmar'}
                </button>
                <button className="btn-outline" onClick={() => setPidiendoFirma(true)}>
                  Actualizar mi firma
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '1em', display: 'flex', gap: '0.8em' }}>
        <button className="btn-primary" onClick={descargarPDF} disabled={generandoPDF}>
          {generandoPDF ? 'Generando…' : todosFirmaron ? 'Descargar acta firmada (PDF)' : 'Descargar borrador en PDF'}
        </button>
      </div>
    </div>
  );
}
