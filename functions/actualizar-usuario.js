// Netlify Function: /.netlify/functions/actualizar-usuario
//
// Actualiza el nombre, cargo y/o correo de un integrante del comité.
// - Cualquier usuario autenticado puede editar SU PROPIO perfil.
// - Un administrador puede editar el perfil de cualquier persona.
// El correo se cambia con el SDK de administrador (Firebase Authentication)
// porque cambiarlo desde el navegador exige verificación de correo y volver
// a iniciar sesión; así se evita esa fricción para correcciones simples
// (ej. un correo mal escrito al crear la cuenta).

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

    const decodificado = await admin.auth().verifyIdToken(tokenCabecera);
    const perfilSolicitante = await admin.firestore().doc(`usuarios/${decodificado.uid}`).get();
    const esAdmin = perfilSolicitante.exists && perfilSolicitante.data().rol === 'admin';

    const { uid, nombre, cargo, email } = JSON.parse(event.body || '{}');
    if (!uid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta indicar qué usuario se edita.' }) };
    }

    const esPropioPerfil = uid === decodificado.uid;
    if (!esPropioPerfil && !esAdmin) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo puedes editar tu propio perfil.' }) };
    }
    if (!nombre || !nombre.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'El nombre no puede quedar vacío.' }) };
    }

    const datosAuth = { displayName: nombre.trim() };
    if (email) datosAuth.email = email.trim();
    await admin.auth().updateUser(uid, datosAuth);

    const datosFirestore = { nombre: nombre.trim(), cargo: (cargo || '').trim() };
    if (email) datosFirestore.email = email.trim();
    await admin.firestore().doc(`usuarios/${uid}`).set(datosFirestore, { merge: true });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    const mensaje = err.code === 'auth/email-already-exists'
      ? 'Ese correo ya tiene una cuenta.'
      : err.code === 'auth/invalid-email'
      ? 'El correo no tiene un formato válido.'
      : err.code === 'auth/user-not-found'
      ? 'Ese usuario ya no existe.'
      : 'No se pudieron guardar los cambios.';
    return { statusCode: 500, body: JSON.stringify({ error: mensaje }) };
  }
};
