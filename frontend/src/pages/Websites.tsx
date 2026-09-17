import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, ArrowUpRight, Pencil, Eye, Loader2, X } from 'lucide-react';
import { getData } from '../services/api';
import { LeadWebsite } from '../components/LeadWebsite';
import { EmptyState, PageLoader } from '../components/UI';
import type { CrmLeadFull } from '../types';

interface Project {
  id: string; name: string; status: string; generationStatus: string; generationError: string | null;
  updatedAt: string; publishedAt: string | null; _count: { sections: number };
  crmLead: { id: string; lead: { id: string; nome: string; categoria: string | null; cidade: string | null; estado: string | null } };
}
const filterLabels = { all: 'Todos os projetos', draft: 'Rascunhos', published: 'Publicados', pending: 'Em andamento' };
type ProjectFilter = keyof typeof filterLabels;
const matchesFilter = (p: Project, filter: ProjectFilter) => filter === 'all' || (filter === 'published' ? p.status === 'PUBLISHED' : filter === 'draft' ? p.status === 'DRAFT' && p.generationStatus === 'completed' : p.generationStatus !== 'completed');

export function WebsitesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState<ProjectFilter>('all');
  const [creating, setCreating] = useState(false); const [leads, setLeads] = useState<CrmLeadFull[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false); const [selected, setSelected] = useState('');
  const [createError, setCreateError] = useState('');
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
    setCreating(true); setLoadingLeads(true); setSelected(''); setCreateError('');
    try { const result = await getData<{ leads: CrmLeadFull[] }>('/crm'); setLeads(result.leads.filter(l => l.website?.generationStatus !== 'completed')); }
    catch (e) { setCreateError(e instanceof Error ? e.message : 'Erro ao carregar leads'); }
    finally { setLoadingLeads(false); }
  };
  const shown = projects.filter(p => `${p.name} ${p.crmLead.lead.nome} ${p.crmLead.lead.cidade || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && matchesFilter(p, filter));
  return <div className="page">
    <div className="workspace-heading">
      <div><p className="workspace-eyebrow">Criação / Sites</p><h2>Meus projetos</h2><p>Um lugar para criar, acompanhar e publicar seus sites.</p></div>
      <Button variant="unstyled" className="btn-primary" onClick={() => void openCreate()}><Plus size={16} />Novo projeto</Button>
    </div>
    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<Button variant="unstyled" onClick={() => void load()} className="underline">Tentar novamente</Button></div>}
    <div className="project-tabs" role="tablist" aria-label="Filtrar projetos">{(Object.entries(filterLabels) as [ProjectFilter, string][]).map(([key, label]) => <Button variant="unstyled" key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}>{label}<span>{projects.filter(p => matchesFilter(p, key)).length}</span></Button>)}</div>
    <div className="projects-toolbar"><label className="projects-search"><Search size={15} /><Input unstyled className="input" aria-label="Buscar projetos" placeholder="Buscar por nome ou empresa" value={search} onChange={e => setSearch(e.target.value)} /></label><span>{shown.length} {shown.length === 1 ? 'projeto' : 'projetos'} · mais recentes primeiro</span><Button variant="unstyled" className="btn-secondary !px-3" aria-label="Atualizar projetos" onClick={() => void load()}><RefreshCw size={14} /></Button></div>
    {loading ? <PageLoader /> : shown.length === 0 ? projects.length > 0 ? <div className="panel-flush"><EmptyState title="Nenhum projeto por aqui" description="Tente outro nome ou escolha uma categoria diferente." action={<Button variant="unstyled" className="btn-secondary" onClick={() => { setSearch(''); setFilter('all'); }}>Limpar filtros</Button>} /></div> : <div className="projects-empty">
      <div className="projects-empty-copy"><span aria-hidden="true">Seu próximo projeto.</span><h3>Todo negócio merece<br />um bom lugar na internet.</h3><p>Escolha uma empresa do seu CRM e comece a criar. Seus rascunhos e sites publicados ficam organizados aqui.</p><Button variant="unstyled" className="btn-primary" onClick={() => void openCreate()}>Criar meu primeiro projeto<ArrowUpRight size={15} /></Button></div>
      <div className="projects-empty-steps">{[
        ['01', 'Escolha o estabelecimento', 'Selecione uma empresa que já faz parte do seu CRM.'],
        ['02', 'Dê forma ao site', 'Ajuste os textos, as imagens e cada detalhe no editor.'],
        ['03', 'Publique quando estiver pronto', 'Revise o resultado e compartilhe o site com seu cliente.'],
      ].map(([n, title, copy]) => <div className="projects-empty-step" key={n}><span>{n}</span><div><h4>{title}</h4><p>{copy}</p></div></div>)}</div>
    </div> : <div className="projects-list">{shown.map(project => {
      const ready = project.generationStatus === 'completed';
      const published = project.status === 'PUBLISHED';
      const failed = project.generationStatus === 'failed';
      const status = !ready ? project.generationStatus === 'generating' ? 'Gerando site' : failed ? 'Falha na geração' : 'Pendente' : published ? 'Publicado' : 'Rascunho';
      const initials = project.name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
      return <article key={project.id} className="project-row">
        <div className="project-initials" aria-hidden="true">{initials}</div>
        <div className="project-info"><h3 title={project.name}>{project.name}</h3><Link to={`/leads/${project.crmLead.lead.id}`}>{project.crmLead.lead.nome}<ArrowUpRight size={11} /></Link><p>{[project.crmLead.lead.categoria, project.crmLead.lead.cidade].filter(Boolean).join(' · ')}</p></div>
        <span className={`project-status ${published ? 'is-published' : failed ? 'is-failed' : ''}`}>{status}</span>
        <div className="project-date">{new Date(project.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}<small>{project._count.sections} seções</small></div>
        {ready && <div className="project-row-actions"><Link className="btn-secondary" to={`/studio/${project.id}?preview=1`} title="Visualizar"><Eye size={14} /><span className="sr-only">Visualizar</span></Link><Link className="btn-primary" to={`/studio/${project.id}`}><Pencil size={13} />Editar site</Link>{published && <a className="project-public" href={`/s/${project.id}`} target="_blank" rel="noreferrer" aria-label={`Abrir site publicado: ${project.name}`} title="Abrir publicado"><ArrowUpRight size={16} /></a>}</div>}
        {!ready && <div className="project-generation"><LeadWebsite crmLeadId={project.crmLead.id} /></div>}
      </article>;
    })}</div>}
    {creating && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="new-project-title" className="panel max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto !p-7"><div className="flex items-center justify-between"><h2 id="new-project-title" className="text-lg font-semibold text-slate-900 dark:text-white">Novo projeto</h2><Button variant="unstyled" className="btn-ghost !px-2" aria-label="Fechar" onClick={() => { setCreating(false); void load(); }}><X size={18} /></Button></div><p className="text-sm leading-relaxed text-slate-500">Para qual estabelecimento vamos criar um site?</p>{createError && <p role="alert" className="text-sm text-red-600">{createError}</p>}{loadingLeads ? <Loader2 size={22} className="animate-spin" /> : leads.length ? <><label className="block space-y-2 text-sm"><span>Estabelecimento</span><Select className="input" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecione um lead...</option>{leads.map(l => <option key={l.id} value={l.id}>{l.lead.nome}{l.lead.cidade ? ` — ${l.lead.cidade}` : ''}</option>)}</Select></label>{selected && <LeadWebsite key={selected} crmLeadId={selected} />}</> : !createError && <div className="space-y-4"><p className="text-sm leading-relaxed text-slate-500">Adicione uma empresa ao CRM para começar um novo projeto. Os leads que já têm site continuam disponíveis na sua lista de projetos.</p><div className="flex flex-wrap gap-2"><Link className="btn-primary" to="/crm">Abrir CRM</Link><Link className="btn-secondary" to="/prospeccao">Pesquisar empresas</Link></div></div>}</section></div>}
  </div>;
}
