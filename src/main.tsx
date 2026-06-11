import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Best-effort portrait lock for installed PWA (older Androids may not support it)
try {
  const so = screen.orientation as ScreenOrientation & {
    lock?: (o: string) => Promise<void>;
  };
  so.lock?.('portrait').catch(() => {});
} catch {
  /* unsupported — CSS handles layout either way */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
