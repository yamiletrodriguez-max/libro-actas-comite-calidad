// Llama a la función serverless (Netlify Function) que a su vez llama a la
// API de Anthropic con la llave guardada de forma segura en el servidor.
// Nunca coloques tu llave de Anthropic en el código del navegador.

export async function mejorarRedaccion(textoBorrador, contexto = '') {
  const respuesta = await fetch('/.netlify/functions/mejorar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: textoBorrador, contexto }),
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo mejorar el texto en este momento.');
  }

  const datos = await respuesta.json();
  return datos.textoMejorado;
}
