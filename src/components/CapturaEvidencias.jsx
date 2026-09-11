import React, { useState } from 'react';

// Permite adjuntar fotos que evidencien la reunión (ej. asistentes,
// pizarra, materiales). Igual que la firma: se comprimen en el navegador
// y se guardan como texto (base64) dentro del propio documento del acta
// en Firestore -- no requiere Firebase Storage ni tarjeta.
//
// Se limita la cantidad y el tamaño para no acercarse al límite de 1 MB
// por documento de Firestore.

const ANCHO_MAX = 900; // px
const CALIDAD_JPEG = 0.6;
const MAX_EVIDENCIAS = 6;

function comprimirImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, ANCHO_MAX / img.width);
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

/**
 * @param {string[]} evidencias - arreglo de imágenes en base64 ya guardadas
 * @param {(nuevas: string[]) => void} alCambiar - se llama con el arreglo actualizado
 */
export default function CapturaEvidencias({ evidencias = [], alCambiar }) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  async function manejarSeleccion(e) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (archivos.length === 0) return;

    setError('');
    const espacioDisponible = MAX_EVIDENCIAS - evidencias.length;
    if (espacioDisponible <= 0) {
      setError(`Ya tienes el máximo de ${MAX_EVIDENCIAS} fotos de evidencia para esta acta.`);
      return;
    }

    const aProcesar = archivos.slice(0, espacioDisponible);
    if (archivos.length > espacioDisponible) {
      setError(`Solo se agregaron ${espacioDisponible} foto(s); el máximo por acta es ${MAX_EVIDENCIAS}.`);
    }

    setProcesando(true);
    try {
      const nuevas = [];
      for (const archivo of aProcesar) {
        if (!archivo.type.startsWith('image/')) continue;
        const b64 = await comprimirImagen(archivo);
        nuevas.push(b64);
      }
      alCambiar([...evidencias, ...nuevas]);
    } catch (e) {
      setError('No se pudo procesar alguna de las fotos. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  function quitar(indice) {
    alCambiar(evidencias.filter((_, i) => i !== indice));
  }

  return (
    <div>
      {evidencias.length > 0 && (
        <div className="galeria-evidencias">
          {evidencias.map((src, i) => (
            <div key={i} className="miniatura-evidencia">
              <img src={src} alt={`Evidencia ${i + 1}`} />
              <button type="button" className="quitar-evidencia" onClick={() => quitar(i)} title="Quitar foto">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {evidencias.length < MAX_EVIDENCIAS && (
        <div style={{ marginTop: evidencias.length > 0 ? '0.9em' : 0 }}>
          <input type="file" accept="image/*" multiple onChange={manejarSeleccion} disabled={procesando} />
          <p className="ayuda-ia">
            Fotos que evidencien la reunión (asistentes, pizarra, materiales). Hasta {MAX_EVIDENCIAS} por acta.
          </p>
        </div>
      )}
      {procesando && <p className="ayuda-ia">Procesando fotos…</p>}
      {error && <div className="mensaje-error" style={{ marginTop: '0.6em' }}>{error}</div>}
    </div>
  );
}
