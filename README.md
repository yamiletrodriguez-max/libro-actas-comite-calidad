# Libro de Actas Digital — Comité de Calidad
### Politécnico y Centro Educativo Padre Luis Variara

Plataforma para redactar, mejorar con IA, firmar digitalmente y archivar las
actas de reunión del Comité de Calidad. Tiene dos áreas: **Administración**
(crea actas y usuarios) y **Docentes/integrantes** (revisan y firman las
actas donde participaron).

## Qué incluye

- Login con correo y contraseña (Firebase Authentication).
- Área administrativa: redactar actas, mejorar la redacción con IA, elegir
  participantes, publicar el acta para firmas, crear cuentas nuevas.
- Área de docentes: ver actas pendientes de su firma, aceptar y firmar con
  su firma digital (una foto de su firma manuscrita, subida una sola vez y
  reutilizada automáticamente).
- Generación de PDF con el logo institucional, el contenido del acta y las
  firmas de todos los participantes, disponible para descargar en cualquier
  momento (y marcado como "firmado" cuando todos ya firmaron).
- Todo se guarda en Firestore con un enlace único de acceso para toda la
  institución.

**Nota importante:** esta plataforma usa **solo el plan gratuito de Firebase
(Spark)** — Authentication y Firestore no piden tarjeta. A propósito NO usa
Firebase Storage, porque desde 2026 ese servicio exige activar el plan Blaze
(pago por uso) y vincular una tarjeta, incluso si te quedas en el uso
gratuito. En su lugar, las firmas se comprimen a una imagen pequeña en el
navegador y se guardan como texto (base64) directo en Firestore, y el PDF se
genera al momento en el navegador cada vez que alguien lo descarga, sin subir
nada a ningún servidor de almacenamiento. Si en el futuro decides activar
Storage (por ejemplo, para adjuntar archivos grandes a las actas), el código
está preparado para agregarlo después sin rehacer nada.

## 1. Crear el proyecto en Firebase (una sola vez)

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo, por
   ejemplo `libro-actas-variara`.
2. Dentro del proyecto, entra a **Compilación → Authentication → Comenzar**
   y activa el método **Correo electrónico/contraseña**.
3. Entra a **Firestore Database → Crear base de datos** (modo producción,
   región más cercana, por ejemplo `us-east1`). No hace falta activar
   Storage — esta plataforma no lo usa (ver nota arriba).
4. En **Configuración del proyecto → Tus apps**, agrega una app web y copia
   los valores que te da (apiKey, authDomain, etc.) — los necesitarás en el
   paso 3.
5. En **Configuración del proyecto → Cuentas de servicio**, haz clic en
   **Generar nueva clave privada**. Se descarga un archivo `.json`: lo
   necesitas para que la plataforma pueda crear usuarios sin cerrar tu
   sesión de administradora.

## 2. Crear tu primera cuenta de administradora

Como aún no hay ningún admin, crea la primera cuenta manualmente:

1. En Firebase Console → Authentication → Users → **Agregar usuario**, crea
   tu cuenta (tu correo y una contraseña).
2. En Firestore Database → Iniciar colección → nombre `usuarios`.
3. El ID del documento debe ser el **UID** de ese usuario (lo ves en la
   lista de Authentication). Agrega estos campos:
   - `nombre` (string): tu nombre completo
   - `rol` (string): `admin`
   - `cargo` (string): tu cargo, ej. "Coordinadora del Comité de Calidad"
   - `firmaURL` (string o null): déjalo vacío por ahora

Desde ahí, ya puedes crear al resto del comité directamente desde la
plataforma (pestaña "Gestionar usuarios").

## 3. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env
```

Abre `.env` y pega los valores del paso 1.4 (apiKey, authDomain, etc.).

Coloca el logo institucional en `public/logo.png`.

Para probarlo en tu computadora:

```bash
npm run dev
```

## 4. Desplegar en Netlify (igual que tus otros proyectos)

1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project**, conecta el
   repositorio.
3. Build command: `npm run build` — Publish directory: `dist` (ya está
   configurado en `netlify.toml`).
4. En **Site settings → Environment variables**, agrega:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID` (del paso 1.4)
   - `ANTHROPIC_API_KEY`: tu llave de https://console.anthropic.com
     (para la mejora de redacción con IA)
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: el contenido completo del archivo
     `.json` del paso 1.5, pegado como una sola línea
5. Publica el sitio. Netlify te da un enlace tipo
   `https://libro-actas-variara.netlify.app`; ese es el enlace que
   comparte con todo el comité. Puedes conectarle un dominio propio después.

## 5. Publicar las reglas de seguridad

Con Firebase CLI instalado (`npm install -g firebase-tools`):

```bash
firebase login
firebase init firestore storage   # selecciona tu proyecto, usa los archivos
                                    # firestore.rules y storage.rules que ya
                                    # están en esta carpeta
firebase deploy --only firestore:rules,storage:rules
```

Esto asegura que solo la administración pueda crear/editar actas, y que
cada docente solo pueda firmar (no editar el contenido del acta).

## Cómo funciona el flujo de firma

1. Administración redacta el acta, usa "Mejorar redacción con IA" si quiere,
   selecciona a los participantes y publica.
2. Cada participante ve el acta en "Pendientes de tu firma", la lee, y
   presiona "Aceptar y firmar". Si es la primera vez, se le pide subir una
   foto de su firma manuscrita — de ahí en adelante se usa automáticamente.
3. Cuando el último participante firma, el acta pasa a estado "completa".
   El botón de descarga genera el PDF con el logo, el contenido y todas las
   firmas al momento, directo en el navegador de quien lo pide — no depende
   de ningún archivo guardado en un servidor.

## Estructura del proyecto

```
src/
  firebase.js          Configuración de Firebase
  context/AuthContext.jsx   Sesión y rol del usuario
  pages/Login.jsx
  pages/PanelAdmin.jsx      Libro de actas + gestión de usuarios
  pages/EditorActa.jsx      Redactar / mejorar con IA / publicar
  pages/PanelDocente.jsx    Actas pendientes de firma
  pages/DetalleActa.jsx     Ver, firmar y descargar el PDF
  pages/MiPerfil.jsx        Gestionar tu firma guardada
  components/CapturaFirma.jsx
  components/SelectorParticipantes.jsx
  utils/generarPDF.js       Genera el PDF con jsPDF
  utils/mejorarTexto.js     Llama a la función de IA
functions/
  mejorar-texto.js      Función serverless: mejora redacción con Claude
  crear-usuario.js      Función serverless: crea cuentas sin cerrar tu sesión
firestore.rules
storage.rules
```

## Siguientes pasos posibles

- Agregar notificaciones por correo cuando se publica una acta o falta tu firma.
- Agregar un buscador/filtro por fecha o estado en el libro de actas.
- Exportar el libro completo (todas las actas) en un solo PDF por período.
