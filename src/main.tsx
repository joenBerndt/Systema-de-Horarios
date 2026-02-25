import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  createRoot(document.getElementById("root")!).render(
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2 style={{ color: 'red' }}>Error de Configuración Crítico</h2>
      <p>No se encontró la variable de entorno <b>VITE_GOOGLE_CLIENT_ID</b>.</p>
      <p>Si estás en Vercel: Ve a Settings &gt; Environment Variables, añade la clave y haz un <b>Redeploy</b>.</p>
    </div>
  );
} else {
  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
}