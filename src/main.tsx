import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import CookieBanner from './components/site/CookieBanner';
import './index.css';

// Stránky, které nejsou předgenerované (např. vůz přidaný po posledním nasazení), dostanou
// HTML hlavní stránky. Jeho canonical/og:url by se tloukly s tím, co nastaví Helmet,
// proto je odstraníme, pokud neodpovídají aktuální adrese. Předgenerované stránky zůstanou beze změny.
const here = `https://www.aufinauto.cz${location.pathname.replace(/\/+$/, '') || '/'}`;
document.querySelectorAll('link[rel="canonical"]:not([data-rh]), meta[property="og:url"]:not([data-rh])').forEach((el) => {
  const url = el.getAttribute('href') ?? el.getAttribute('content') ?? '';
  if (url.replace(/\/+$/, '') !== here.replace(/\/+$/, '')) el.remove();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <CookieBanner />
    </HelmetProvider>
  </StrictMode>,
);
