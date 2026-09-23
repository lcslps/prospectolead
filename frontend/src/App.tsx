import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, MobileTopbar } from './components/layout';
import { Criar, Leads, Crm, LeadDetail, privateNav } from './pages/private';

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

function activeIdFromPath(pathname: string): string {
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/criar')) return 'criar';
  if (pathname.startsWith('/leads')) return 'leads';
  return 'leads';
}

export default function App() {
  const [backendUrl] = useState(initialBackendUrl);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => localStorage.setItem('cloudflare_backend', backendUrl.trim()), [backendUrl]);
  useEffect(() => {
    localStorage.removeItem('gemini_api_key');
  }, []);

  const activePage = activeIdFromPath(location.pathname);
  const activeNav = privateNav.find((item) => item.id === activePage);
  const ActiveIcon = activeNav?.icon;

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1a1d21] font-['Poppins',_sans-serif]">
      <div className="flex min-h-screen">
        <Sidebar
          title="Gerador de Sites"
          items={privateNav}
          activeId={activePage}
          onNavigate={(id) => navigate(`/${id}`)}
        />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <MobileTopbar
            label={activeNav?.label ?? ''}
            icon={ActiveIcon ? <ActiveIcon size={15} strokeWidth={2.25} /> : undefined}
          />

          <Routes>
            <Route path="/" element={<Navigate to="/leads" replace />} />
            <Route path="/leads" element={<Leads backendUrl={backendUrl} />} />
            <Route path="/crm" element={<Crm backendUrl={backendUrl} />} />
            <Route path="/crm/:id" element={<LeadDetail backendUrl={backendUrl} />} />
            <Route path="/criar" element={<Criar backendUrl={backendUrl} />} />
            <Route path="*" element={<Navigate to="/leads" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
