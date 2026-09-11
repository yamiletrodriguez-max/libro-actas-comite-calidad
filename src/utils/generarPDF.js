import { jsPDF } from 'jspdf';

// Convierte una URL de imagen a base64 (solo se usa para el logo, que es un
// archivo estático servido por el hosting -- no requiere Firebase Storage).
async function urlABase64(url) {
  const respuesta = await fetch(url);
  const blob = await respuesta.blob();
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(blob);
  });
}

// Las firmas ya vienen guardadas como base64 en Firestore (ver CapturaFirma.jsx),
// así que se usan directamente, sin necesidad de descargarlas de ningún lado.

/**
 * Genera el PDF de un acta.
 * @param {Object} acta - documento del acta (numero, titulo, fecha, lugar, agenda, desarrollo, acuerdos, participantes[])
 * @param {string} logoURL - URL pública del logo institucional (ej. /logo.png)
 * @returns {Blob} PDF listo para subir a Storage o descargar
 */
export async function generarPDFActa(acta, logoURL = '/logo.png') {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margen = 56;
  let y = margen;
  const anchoUtil = doc.internal.pageSize.getWidth() - margen * 2;

  // --- Encabezado con logo ---
  try {
    const logoB64 = await urlABase64(logoURL);
    doc.addImage(logoB64, 'PNG', margen, y, 46, 46);
  } catch (e) {
    // Si el logo no carga, seguimos sin bloquear la generación del PDF
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('Politécnico y Centro Educativo Padre Luis Variara', margen + 58, y + 16);
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('Comité de Calidad · Libro de Actas', margen + 58, y + 32);
  y += 66;

  doc.setDrawColor(20, 45, 70);
  doc.setLineWidth(1.2);
  doc.line(margen, y, margen + anchoUtil, y);
  y += 26;

  // --- Título y metadatos ---
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(`Acta No. ${acta.numero} — ${acta.titulo}`, margen, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Fecha: ${acta.fecha}      Lugar: ${acta.lugar}`, margen, y);
  y += 24;

  // --- Agenda ---
  if (acta.agenda) {
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('Agenda', margen, y);
    y += 16;
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    const lineasAgenda = doc.splitTextToSize(acta.agenda, anchoUtil);
    doc.text(lineasAgenda, margen, y);
    y += lineasAgenda.length * 13 + 16;
  }

  // --- Desarrollo de la reunión ---
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text('Desarrollo de la reunión', margen, y);
  y += 16;
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const lineasDesarrollo = doc.splitTextToSize(acta.desarrollo || '', anchoUtil);
  for (const linea of lineasDesarrollo) {
    if (y > 720) {
      doc.addPage();
      y = margen;
    }
    doc.text(linea, margen, y);
    y += 13;
  }
  y += 12;

  // --- Acuerdos ---
  if (acta.acuerdos) {
    if (y > 680) { doc.addPage(); y = margen; }
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('Acuerdos', margen, y);
    y += 16;
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    const lineasAcuerdos = doc.splitTextToSize(acta.acuerdos, anchoUtil);
    for (const linea of lineasAcuerdos) {
      if (y > 720) { doc.addPage(); y = margen; }
      doc.text(linea, margen, y);
      y += 13;
    }
    y += 16;
  }

  // --- Evidencia fotográfica ---
  const evidencias = acta.evidencias || [];
  if (evidencias.length > 0) {
    if (y > 640) { doc.addPage(); y = margen; }
    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.text('Evidencia fotográfica', margen, y);
    y += 18;

    const colAnchoEv = (anchoUtil - 12) / 2;
    const altoEv = 130;
    let colEv = 0;
    let filaYEv = y;
    for (const foto of evidencias) {
      if (filaYEv + altoEv > 730) { doc.addPage(); filaYEv = margen; colEv = 0; }
      const xEv = margen + colEv * (colAnchoEv + 12);
      try {
        doc.addImage(foto, 'JPEG', xEv, filaYEv, colAnchoEv, altoEv);
      } catch (e) {
        // si una foto no carga, se deja el espacio en blanco
      }
      colEv++;
      if (colEv > 1) {
        colEv = 0;
        filaYEv += altoEv + 12;
      }
    }
    y = colEv === 0 ? filaYEv + 16 : filaYEv + altoEv + 16;
  }

  // --- Firmas ---
  const participantes = acta.participantes || [];
  const colAncho = anchoUtil / 2;
  let colX = margen;
  if (y > 620) { doc.addPage(); y = margen; }
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text('Firmas de los participantes', margen, y);
  y += 22;

  let filaInicioY = y;
  let columna = 0;

  for (const p of participantes) {
    if (y > 700) { doc.addPage(); y = margen; filaInicioY = y; columna = 0; colX = margen; }

    colX = margen + columna * colAncho;

    if (p.firmado && p.firmaURL) {
      try {
        doc.addImage(p.firmaURL, 'PNG', colX, filaInicioY, 130, 40);
      } catch (e) {
        // si la firma no carga, se deja el espacio en blanco
      }
    }

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.6);
    doc.line(colX, filaInicioY + 46, colX + 150, filaInicioY + 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(p.nombre, colX, filaInicioY + 60);
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(p.cargo || '', colX, filaInicioY + 72);
    doc.setTextColor(0, 0, 0);

    columna++;
    if (columna > 1) {
      columna = 0;
      filaInicioY += 100;
      y = filaInicioY;
    }
  }

  return doc.output('blob');
}
