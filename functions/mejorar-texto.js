// Netlify Function: /.netlify/functions/mejorar-texto
//
// Recibe el texto borrador de un acta y devuelve una versión con redacción
// formal, clara y correcta, sin inventar acuerdos ni datos que no estén
// en el borrador original.
//
// Usa Google Gemini (capa gratuita de Google AI Studio, sin tarjeta).
// Configura la variable de entorno GEMINI_API_KEY en Netlify:
// Site settings -> Environment variables -> GEMINI_API_KEY
// Consíguela gratis en https://aistudio.google.com/apikey

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const { texto, contexto } = JSON.parse(event.body || '{}');

    if (!texto || !texto.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta el texto a mejorar.' }) };
    }

    const promptSistema = `Eres un asistente de redacción para actas de comité de calidad de un
politécnico dominicano (marco MINERD). Mejora la redacción del texto que te
entrega el usuario: corrige ortografía y gramática, dale un tono formal e
institucional, y organiza las ideas con claridad. NO inventes acuerdos,
nombres, fechas ni cifras que no estén en el texto original. No agregues
encabezados ni firmas, solo el cuerpo mejorado del texto. Responde
únicamente con el texto mejorado, sin comentarios adicionales.`;

    const mensajeUsuario = contexto
      ? `Contexto de la reunión: ${contexto}\n\nTexto a mejorar:\n${texto}`
      : `Texto a mejorar:\n${texto}`;

    const modelo = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: promptSistema }] },
        contents: [{ role: 'user', parts: [{ text: mensajeUsuario }] }],
        generationConfig: { maxOutputTokens: 1500 },
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Error de Gemini:', detalle);
      return { statusCode: 502, body: JSON.stringify({ error: 'Error al mejorar el texto.' }) };
    }

    const datos = await respuesta.json();
    const textoMejorado = (datos.candidates?.[0]?.content?.parts || [])
      .map((parte) => parte.text || '')
      .join('\n')
      .trim();

    if (!textoMejorado) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No se recibió texto mejorado.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ textoMejorado }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno.' }) };
  }
};
