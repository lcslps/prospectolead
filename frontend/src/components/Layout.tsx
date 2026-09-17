import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Crosshair,
  Database,
  Filter,
  FolderOpen,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './Theme';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prospeccao', label: 'Prospecção', icon: Crosshair },
  { to: '/leads', label: 'Resultados da prospecção', icon: Database },
  { to: '/crm', label: 'CRM', icon: Filter },
  { to: '/campanhas', label: 'Campanhas', icon: FolderOpen },
  { to: '/templates', label: 'Templates', icon: MessageSquareText },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/dashboard', title: 'Dashboard' },
  { prefix: '/prospeccao', title: 'Prospecção' },
  { prefix: '/leads', title: 'Resultados da prospecção' },
  { prefix: '/crm', title: 'CRM' },
  { prefix: '/campanhas', title: 'Campanhas' },
  { prefix: '/templates', title: 'Templates' },
  { prefix: '/configuracoes', title: 'Configurações' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentTitle =
    PAGE_TITLES.find((p) =>
      location.pathname.startsWith(p.prefix) && (location.pathname === p.prefix || p.prefix === '/leads' || location.pathname.startsWith(`${p.prefix}/`)),
    )?.title ?? 'Prospector de Leads';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Target className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Prospector</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Google Places API</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Sistema de prospecção de<br />leads locais
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              aria-label="Abrir menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/prospeccao"
              className="hidden items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 sm:inline-flex"
            >
              <BarChart3 className="h-4 w-4" />
              Prospectar
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
