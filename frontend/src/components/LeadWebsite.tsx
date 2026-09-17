import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Globe, Loader2, Sparkles } from 'lucide-react';
import { getData, postData } from '../services/api';
import type { Website } from '../types/website';

interface Summary { id: string; status: string; generationStatus: string; generationError?: string | null }
export function LeadWebsite({ crmLeadId, leadId }: { crmLeadId?: string | null; leadId?: string }) {
  const navigate = useNavigate(); const [crmId, setCrmId] = useState(crmLeadId); const [site, setSite] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!crmLeadId);
  useEffect(() => { setCrmId(crmLeadId); }, [crmLeadId]);
  useEffect(() => {
    if (!crmId) return; let active = true;
    const load = () => getData<Summary | null>(`/websites/lead/${crmId}`).then(s => { if (active) { setSite(s); if (s?.generationError) setError(s.generationError); setLoading(false); } }).catch(e => { if (active) { setError(e.message); setLoading(false); } });
    void load(); const timer = setInterval(() => { void load(); }, 4000); return () => { active = false; clearInterval(timer); };
  }, [crmId]);
  const generate = async () => { setBusy(true); setError(''); try { const s = await postData<Website>('/websites/generate', { crmLeadId: crmId }); setSite(s); navigate(`/studio/${s.id}`); } catch (e) { setError(e instanceof Error ? e.message : 'Erro na geração'); } finally { setBusy(false); } };
  const add = async () => { setBusy(true); setError(''); try { const result = await postData<{ crmLead: { id: string } }>('/crm/leads', { leadId }); setCrmId(result.crmLead.id); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao adicionar'); } finally { setBusy(false); } };
  const working = busy || site?.generationStatus === 'generating';
  return <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><Globe size={16} />Site do estabelecimento</h3>
    {!crmId ? <><p className="mb-3 text-xs text-slate-500">Este estabelecimento é um resultado de prospecção. Adicione ao CRM para criar o site.</p><button disabled={busy} className="btn-primary" onClick={() => void add()}>Adicionar ao CRM</button></> : loading ? <Loader2 className="animate-spin" size={18} /> : site?.generationStatus === 'completed' ? <div className="flex flex-wrap gap-2"><Link className="btn-primary" to={`/studio/${site.id}`}>Editar site</Link><Link className="btn-secondary" to={`/studio/${site.id}?preview=1`}>Visualizar</Link><Link className="btn-secondary" to={`/studio/${site.id}`}>Publicar</Link>{site.status === 'PUBLISHED' && <a className="btn-secondary" href={`/s/${site.id}`} target="_blank" rel="noreferrer">Site publicado ↗</a>}</div> : <>
      <button className="btn-primary" disabled={working} onClick={() => void generate()}>{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}{working ? 'Gerando site com IA...' : 'Gerar site com IA'}</button>
      {working && <div className="mt-4 space-y-2 text-xs text-slate-500" role="status"><p className="flex gap-2"><Check size={14} />Dados do estabelecimento preparados</p><p className="flex gap-2"><Loader2 size={14} className="animate-spin" />Gemini criando a estrutura e os textos...</p><p>O site será validado e salvo antes de abrir o editor.</p></div>}
    </>}{error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}{site?.generationStatus === 'generating' && !busy && <button className="mt-3 text-xs text-indigo-600" onClick={() => void generate()}>Verificar / retomar geração</button>}
  </section>;
}
