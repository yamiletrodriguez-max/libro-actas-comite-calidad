// Netlify Function: /.netlify/functions/mejorar-texto
//
// Recibe el texto borrador de un acta y devuelve una versión con redacción
// formal, clara y correcta, sin inventar acuerdos ni datos que no estén
// en el borrador original.
//
// Configura la variable de entorno ANTHROPIC_API_KEY en Netlify:
// Site settings -> Environment variables -> ANTHROPIC_API_KEY

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

    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        system: promptSistema,
        messages: [{ role: 'user', content: mensajeUsuario }],
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Error de Anthropic:', detalle);
      return { statusCode: 502, body: JSON.stringify({ error: 'Error al mejorar el texto.' }) };
    }

    const datos = await respuesta.json();
    const textoMejorado = datos.content
      .filter((bloque) => bloque.type === 'text')
      .map((bloque) => bloque.text)
      .join('\n')
      .trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ textoMejorado }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno.' }) };
  }
};
