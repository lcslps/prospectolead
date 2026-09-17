import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Search, RefreshCw, ArrowUpRight, Pencil, Eye, FolderOpen, Loader2 } from 'lucide-react';
import { getData } from '../services/api';
import { LeadWebsite } from '../components/LeadWebsite';
import { EmptyState, PageLoader } from '../components/UI';
import type { CrmLeadFull } from '../types';

interface Project {
  id: string; name: string; status: string; generationStatus: string; generationError: string | null;
  updatedAt: string; publishedAt: string | null; _count: { sections: number };
  crmLead: { id: string; lead: { id: string; nome: string; categoria: string | null; cidade: string | null; estado: string | null } };
}
export function WebsitesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false); const [leads, setLeads] = useState<CrmLeadFull[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false); const [selected, setSelected] = useState('');
  const load = useCallback(async () => {
    try { setProjects(await getData<Project[]>('/websites')); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar projetos'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!projects.some(p => p.generationStatus === 'generating')) return;
    const timer = setInterval(() => void load(), 5000); return () => clearInterval(timer);
  }, [projects, load]);
  const openCreate = async () => {
    setCreating(true); setLoadingLeads(true); setSelected('');
    try { const result = await getData<{ leads: CrmLeadFull[] }>('/crm'); setLeads(result.leads.filter(l => l.website?.generationStatus !== 'completed')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar leads'); }
    finally { setLoadingLeads(false); }
  };
  const shown = projects.filter(p => {
    const match = `${p.name} ${p.crmLead.lead.nome} ${p.crmLead.lead.cidade || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'));
    return match && (filter === 'all' || (filter === 'published' ? p.status === 'PUBLISHED' : filter === 'draft' ? p.status === 'DRAFT' && p.generationStatus === 'completed' : p.generationStatus !== 'completed'));
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Meus projetos</h2><p className="mt-1 text-sm text-slate-500">Seus sites, do primeiro rascunho à publicação.</p></div><button className="btn-primary" onClick={() => void openCreate()}><Plus size={17} />Novo projeto</button></div>
    <div className="grid grid-cols-3 gap-3">{[['Total de sites', projects.length], ['Rascunhos', projects.filter(p => p.status === 'DRAFT' && p.generationStatus === 'completed').length], ['Publicados', projects.filter(p => p.status === 'PUBLISHED').length]].map(([label, value]) => <div className="card p-4" key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>)}</div>
    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => void load()} className="underline">Tentar novamente</button></div>}
    <div className="flex flex-wrap gap-3"><label className="relative min-w-56 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-9" aria-label="Buscar projetos" placeholder="Buscar site, empresa ou cidade..." value={search} onChange={e => setSearch(e.target.value)} /></label><select className="input !w-auto" aria-label="Filtrar projetos" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos os projetos</option><option value="draft">Rascunhos</option><option value="published">Publicados</option><option value="pending">Em geração / pendentes</option></select><button className="btn-secondary" aria-label="Atualizar projetos" onClick={() => void load()}><RefreshCw size={16} /></button></div>
    {loading ? <PageLoader /> : shown.length === 0 ? <div className="card p-8"><EmptyState icon={<FolderOpen size={40} />} title={projects.length ? 'Nenhum projeto encontrado' : 'Você ainda não tem sites criados'} description={projects.length ? 'Altere a busca ou os filtros para encontrar seu site.' : 'Crie um projeto para um estabelecimento do CRM. Os sites gerados aparecerão aqui automaticamente.'} action={!projects.length ? <button className="btn-primary" onClick={() => void openCreate()}><Plus size={16} />Criar meu primeiro projeto</button> : undefined} /></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shown.map(project => {
      const ready = project.generationStatus === 'completed';
      return <article key={project.id} className="card overflow-hidden"><div className="flex h-28 items-center justify-between bg-gradient-to-br from-indigo-50 to-cyan-50 px-6 dark:from-indigo-950 dark:to-slate-800"><Globe size={38} className="text-indigo-400" /><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{!ready ? project.generationStatus === 'generating' ? 'Gerando site...' : project.generationStatus === 'failed' ? 'Falha na geração' : 'Pendente' : project.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}</span></div><div className="space-y-4 p-5"><div><h3 className="truncate text-base font-bold text-slate-900 dark:text-white" title={project.name}>{project.name}</h3><Link className="text-xs text-indigo-600 hover:underline dark:text-indigo-400" to={`/leads/${project.crmLead.lead.id}`}>{project.crmLead.lead.nome}<ArrowUpRight size={12} className="ml-1 inline" /></Link><p className="mt-1 text-xs text-slate-500">{[project.crmLead.lead.categoria, project.crmLead.lead.cidade, project.crmLead.lead.estado].filter(Boolean).join(' · ')}</p></div><p className="text-xs text-slate-400">{project._count.sections} seções · Atualizado em {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</p>{ready ? <div className="flex flex-wrap gap-2"><Link className="btn-primary !px-3 !py-2 text-xs" to={`/studio/${project.id}`}><Pencil size={14} />Editar site</Link><Link className="btn-secondary !px-3 !py-2 text-xs" to={`/studio/${project.id}?preview=1`}><Eye size={14} />Visualizar</Link>{project.status === 'PUBLISHED' && <a className="text-xs font-semibold text-indigo-600 hover:underline" href={`/s/${project.id}`} target="_blank" rel="noreferrer">Abrir publicado ↗</a>}</div> : <LeadWebsite crmLeadId={project.crmLead.id} />}</div></article>;
    })}</div>}
    {creating && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="new-project-title" className="card w-full max-w-lg space-y-5 p-6"><div className="flex items-center justify-between"><h2 id="new-project-title" className="text-lg font-bold text-slate-900 dark:text-white">Novo projeto</h2><button className="btn-ghost !px-2" onClick={() => { setCreating(false); void load(); }}>Fechar</button></div><p className="text-sm text-slate-500">Escolha o estabelecimento do CRM para criar seu site.</p>{loadingLeads ? <Loader2 size={22} className="animate-spin" /> : leads.length ? <><label className="block space-y-2 text-sm"><span>Estabelecimento</span><select className="input" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecione um lead...</option>{leads.map(l => <option key={l.id} value={l.id}>{l.lead.nome}{l.lead.cidade ? ` — ${l.lead.cidade}` : ''}</option>)}</select></label>{selected && <LeadWebsite key={selected} crmLeadId={selected} />}</> : <div className="space-y-4"><p className="text-sm text-slate-500">Não há leads sem site disponíveis. Adicione um estabelecimento ao CRM para iniciar outro projeto.</p><Link className="btn-primary" to="/crm">Abrir CRM</Link><Link className="btn-secondary ml-2" to="/prospeccao">Prospectar empresas</Link></div>}</section></div>}
  </div>;
}
