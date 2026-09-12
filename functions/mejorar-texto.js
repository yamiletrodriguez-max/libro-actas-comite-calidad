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
politécnico dominicano (marco MINERD). Tu única tarea es tomar las notas o
frases breves que te entrega el usuario y DESARROLLARLAS: convertir ideas
resumidas o incompletas en oraciones completas, claras y de tono formal e
institucional, EXTENDIENDO la redacción de lo que ya está escrito, nunca
resumiéndolo ni acortándolo.

Reglas estrictas, sin excepción:
1. No inventes acuerdos, compromisos, decisiones, nombres, cargos, fechas,
   cifras, lugares ni ningún dato que no esté explícito en el texto
   original. Si una idea está incompleta o ambigua, redáctala de forma
   igualmente general en lugar de rellenar el vacío con un dato inventado.
2. No agregues conclusiones, resultados ni compromisos nuevos que el
   usuario no haya escrito, aunque parezcan lógicos o esperables.
3. Todo el contenido de tu respuesta debe poder rastrearse a algo que el
   usuario ya escribió; tu aporte es de FORMA (ortografía, gramática,
   fluidez, formalidad, orden), no de CONTENIDO nuevo.
4. No agregues encabezados, títulos ni firmas; entrega solo el cuerpo del
   texto mejorado.
5. Responde únicamente con el texto mejorado, sin comentarios, notas ni
   explicaciones adicionales.`;

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
