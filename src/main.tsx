
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Aplicación ejecutándose con Supabase como base de datos principal');
console.log('🔒 Sistema multi-tenant con aislamiento de datos por usuario');

createRoot(document.getElementById("root")!).render(<App />);
