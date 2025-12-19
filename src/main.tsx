import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './App.css';
import Maintenance from './components/Maintenance';

// Import service worker for PWA functionality
import './service-worker.ts';

// Check for maintenance mode
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

// Render either the maintenance component or the full application
createRoot(document.getElementById('root')!).render(
  isMaintenanceMode ? <Maintenance /> : <App />
);