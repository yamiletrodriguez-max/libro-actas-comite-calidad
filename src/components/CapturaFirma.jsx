import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

// Permite al docente/admin subir UNA foto de su firma manuscrita.
// La imagen se redimensiona y comprime en el navegador, y se guarda como
// texto (base64) directo en su perfil de Firestore -- así no hace falta
// Firebase Storage (que exige plan Blaze / tarjeta). Esa firma se reutiliza
// automáticamente cada vez que acepte y firme un acta.

const ANCHO_FIRMA = 300; // px
const ALTO_FIRMA = 120; // px

function comprimirImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = ANCHO_FIRMA;
        canvas.height = ALTO_FIRMA;
        const ctx = canvas.getContext('2d');
        // fondo blanco (por si la foto tiene transparencia o sombras)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ANCHO_FIRMA, ALTO_FIRMA);
        // encajar la imagen manteniendo proporción, centrada
        const escala = Math.min(ANCHO_FIRMA / img.width, ALTO_FIRMA / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (ANCHO_FIRMA - w) / 2, (ALTO_FIRMA - h) / 2, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

export default function CapturaFirma({ alTerminar }) {
  const { usuario, recargarPerfil } = useAuth();
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  function manejarSeleccion(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Sube una imagen (foto o escaneo de tu firma).');
      return;
    }
    setError('');
    setArchivo(f);
    setVistaPrevia(URL.createObjectURL(f));
  }

  async function guardarFirma() {
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    try {
      const firmaBase64 = await comprimirImagen(archivo);
      await setDoc(doc(db, 'usuarios', usuario.uid), { firmaURL: firmaBase64 }, { merge: true });
      await recargarPerfil();
      if (alTerminar) alTerminar(firmaBase64);
    } catch (e) {
      setError('No se pudo guardar la firma. Intenta con otra foto.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="zona-firma">
      {vistaPrevia ? (
        <img src={vistaPrevia} alt="Vista previa de la firma" />
      ) : (
        <p style={{ color: 'var(--tinta-suave)', fontSize: '0.85rem' }}>
          Sube una foto clara de tu firma manuscrita, en papel blanco y con buena luz.
        </p>
      )}
      <div>
        <input type="file" accept="image/*" onChange={manejarSeleccion} />
      </div>
      {error && <div className="mensaje-error" style={{ marginTop: '0.8em' }}>{error}</div>}
      <button
        className="btn-primary"
        style={{ marginTop: '0.9em' }}
        onClick={guardarFirma}
        disabled={!archivo || subiendo}
      >
        {subiendo ? 'Guardando…' : 'Guardar mi firma'}
      </button>
    </div>
  );
}
