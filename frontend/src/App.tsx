import { useEffect, useState } from 'react';
import { Sidebar, MobileTopbar } from './components/layout';
import { Criar, privateNav } from './pages/private';
import type { PrivatePageId } from './pages/private';

function defaultBackend() {
  return 'http://localhost:3001';
}

function initialBackendUrl() {
  const saved = (localStorage.getItem('cloudflare_backend') || '').trim();
  // Descarta o default antigo bugado (origin do próprio frontend, ex: :5173)
  if (typeof window !== 'undefined' && saved.replace(/\/$/, '') === window.location.origin) {
    return defaultBackend();
  }
  return saved || defaultBackend();
}

export default function App() {
  const [backendUrl] = useState(initialBackendUrl);
  const [activePage, setActivePage] = useState<PrivatePageId>('criar');

  useEffect(() => localStorage.setItem('cloudflare_backend', backendUrl.trim()), [backendUrl]);
  useEffect(() => {
    localStorage.removeItem('gemini_api_key');
  }, []);

  const activeNav = privateNav.find((item) => item.id === activePage);
  const ActiveIcon = activeNav?.icon;

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1a1d21] font-['Poppins',_sans-serif]">
      <div className="flex min-h-screen">
        <Sidebar
          title="Gerador de Sites"
          items={privateNav}
          activeId={activePage}
          onNavigate={(id) => setActivePage(id as PrivatePageId)}
        />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <MobileTopbar
            label={activeNav?.label ?? ''}
            icon={ActiveIcon ? <ActiveIcon size={15} strokeWidth={2.25} /> : undefined}
          />

          {activePage === 'criar' && <Criar backendUrl={backendUrl} />}
        </div>
      </div>
    </div>
  );
}
