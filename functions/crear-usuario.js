// Netlify Function: /.netlify/functions/crear-usuario
//
// Crea una cuenta nueva para un integrante del comité (docente o admin)
// usando el SDK de administrador de Firebase. Esto evita el problema de
// que crear un usuario desde el navegador "cierre la sesión" del admin.
//
// Variables de entorno necesarias en Netlify:
// FIREBASE_SERVICE_ACCOUNT_JSON  -> el JSON completo de la cuenta de servicio
//   (Firebase Console -> Configuración del proyecto -> Cuentas de servicio
//   -> Generar nueva clave privada), pegado como una sola línea.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
  });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const tokenCabecera = (event.headers.authorization || '').replace('Bearer ', '');
    if (!tokenCabecera) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Falta autenticación.' }) };
    }

    // Verifica que quien llama es un administrador
    const decodificado = await admin.auth().verifyIdToken(tokenCabecera);
    const perfilSolicitante = await admin.firestore().doc(`usuarios/${decodificado.uid}`).get();
    if (!perfilSolicitante.exists || perfilSolicitante.data().rol !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede crear usuarios.' }) };
    }

    const { nombre, email, password, rol, cargo } = JSON.parse(event.body || '{}');
    if (!nombre || !email || !password || !rol) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos del nuevo usuario.' }) };
    }

    const nuevoUsuario = await admin.auth().createUser({ email, password, displayName: nombre });

    await admin.firestore().doc(`usuarios/${nuevoUsuario.uid}`).set({
      nombre,
      email,
      rol, // 'admin' o 'docente'
      cargo: cargo || '',
      firmaURL: null,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { statusCode: 200, body: JSON.stringify({ uid: nuevoUsuario.uid }) };
  } catch (err) {
    console.error(err);
    const mensaje = err.code === 'auth/email-already-exists'
      ? 'Ese correo ya tiene una cuenta.'
      : 'No se pudo crear el usuario.';
    return { statusCode: 500, body: JSON.stringify({ error: mensaje }) };
  }
};
