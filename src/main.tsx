import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './App.css';

// Import service worker for PWA functionality
import './service-worker.ts';

createRoot(document.getElementById('root')!).render(<App />);