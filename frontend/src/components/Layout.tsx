import { Button } from './ui/Button';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Crosshair, Database, Filter, FolderOpen, Globe, LayoutDashboard, Menu, MessageSquareText, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './Theme';
import './workspace.css';

const NAV_GROUPS = [
  { label: 'Área de trabalho', items: [{ to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard }] },
  { label: 'Comercial', items: [
    { to: '/prospeccao', label: 'Prospecção', icon: Crosshair },
    { to: '/leads', label: 'Empresas encontradas', icon: Database },
    { to: '/crm', label: 'CRM', icon: Filter },
    { to: '/campanhas', label: 'Campanhas', icon: FolderOpen },
  ] },
  { label: 'Criação', items: [
    { to: '/sites', label: 'Sites / Meus projetos', icon: Globe },
    { to: '/templates', label: 'Modelos de mensagem', icon: MessageSquareText },
  ] },
];
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  const current = NAV_GROUPS.flatMap(g => g.items).find(item => location.pathname.startsWith(item.to));
  const title = current?.label ?? 'Configurações';
  const sidebar = <>
    <Link to="/dashboard" className="workspace-brand" aria-label="ProspectoLead — início"><span>ProspectoLead</span></Link>
    <div className="workspace-account"><div>Meu espaço</div></div>
    <nav className="workspace-nav">{NAV_GROUPS.map(group => <div className="workspace-nav-group" key={group.label}><p>{group.label}</p>{group.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><Icon size={17} strokeWidth={1.7} /><span>{label}</span></NavLink>)}</div>)}</nav>
    <div className="workspace-sidebar-bottom"><NavLink to="/configuracoes" className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><Settings size={17} strokeWidth={1.7} />Configurações</NavLink></div>
  </>;
  return <div className={`workspace-shell ${location.pathname === '/crm' ? 'workspace-crm' : ''}`}>
    <aside className="workspace-sidebar">{sidebar}</aside>
    {sidebarOpen && <div className="workspace-mobile-backdrop" onClick={() => setSidebarOpen(false)}><aside className="workspace-sidebar workspace-sidebar-mobile" onClick={e => e.stopPropagation()}><Button variant="unstyled" className="workspace-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={20} /></Button>{sidebar}</aside></div>}
    <div className="workspace-body"><header className="workspace-topbar"><div className="workspace-breadcrumb"><Button variant="unstyled" className="workspace-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={20} /></Button><span>Área de trabalho</span><ChevronRight size={13} /><h1>{title}</h1></div><div className="workspace-topbar-actions"><Link to="/prospeccao">Nova pesquisa<ArrowUpRight size={15} /></Link><ThemeToggle /></div></header><main className="workspace-content"><Outlet /></main></div>
  </div>;
}
