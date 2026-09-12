// Netlify Function: /.netlify/functions/eliminar-usuario
//
// Elimina por completo la cuenta de un integrante del comité: su usuario de
// Firebase Authentication y su documento en Firestore. Solo un administrador
// puede llamarla. Se hace con el SDK de administrador porque desde el
// navegador no se puede borrar cuentas de Authentication de otra persona,
// y las reglas de Firestore bloquean el borrado directo de /usuarios (a
// propósito, para que nadie pueda hacerlo sin pasar por esta función).

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
    if (!perfilSolicitante.exists || perfilSolicitante.data().rol !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede eliminar usuarios.' }) };
    }

    const { uid } = JSON.parse(event.body || '{}');
    if (!uid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta el usuario a eliminar.' }) };
    }
    if (uid === decodificado.uid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No puedes eliminar tu propia cuenta desde aquí.' }) };
    }

    // Borra primero de Authentication; si eso falla no tocamos Firestore.
    await admin.auth().deleteUser(uid).catch((err) => {
      // Si ya no existe en Authentication (por ejemplo, se borró antes a
      // medias), seguimos y limpiamos igual el documento de Firestore.
      if (err.code !== 'auth/user-not-found') throw err;
    });
    await admin.firestore().doc(`usuarios/${uid}`).delete();

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    // DEBUG TEMPORAL: se incluye el error técnico real (err.code / err.message)
    // para poder diagnosticar sin tener que entrar a los logs de Netlify.
    // Quitar el campo "detalle" una vez resuelto el problema.
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo eliminar el usuario.', detalle: `${err.code || ''} ${err.message || err}`.trim() }) };
  }
};
