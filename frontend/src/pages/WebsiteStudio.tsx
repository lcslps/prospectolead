import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowDown, ArrowUp, Check, Copy, Eye, EyeOff, Globe, GripVertical, Hand, Loader2, Monitor, MousePointer2, Plus, Redo2, Save, Smartphone, Sparkles, Tablet, Trash2, Undo2, X } from 'lucide-react';
import { getData, postData } from '../services/api';
import { SECTION_LABELS, newSection, type SectionType, type SiteContent, type SiteDocument, type Website } from '../types/website';
import { WebsiteFrame } from '../components/WebsiteFrame';
import { SectionFields, SiteFields, TextField } from '../components/WebsiteFields';
import './studio.css';
import { ThemeToggle } from '../components/Theme';

const toDocument = (s: SiteDocument): SiteDocument => ({ name: s.name, business: s.business, theme: s.theme, sections: s.sections });
export function WebsiteStudioPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [doc, setDoc] = useState<SiteDocument | null>(null); const [site, setSite] = useState<Website | null>(null);
  const latest = useRef<SiteDocument | null>(null); const revision = useRef(0); const saved = useRef(''); const saving = useRef<Promise<void> | null>(null);
  const [saveState, setSaveState] = useState('Salvo'); const [error, setError] = useState(''); const [selected, setSelected] = useState<string | null>(null);
  const [width, setWidth] = useState(1200); const [zoom, setZoom] = useState(0.8); const [interactive, setInteractive] = useState(new URLSearchParams(window.location.search).has('preview'));  const [preview, setPreview] = useState(new URLSearchParams(window.location.search).has('preview')); 
  const [history, setHistory] = useState<SiteDocument[]>([]); const [future, setFuture] = useState<SiteDocument[]>([]);
  const [aiOpen, setAiOpen] = useState(false); const [aiBusy, setAiBusy] = useState(false); const [aiField, setAiField] = useState('title'); const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<{ document?: SiteDocument; patch?: Partial<SiteContent>; sectionId?: string | null } | null>(null);
  const [aiError, setAiError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null); const [publishing, setPublishing] = useState(false); const [addOpen, setAddOpen] = useState(true);
  useEffect(() => {
    let active = true;
    getData<Website>(`/websites/${id}`).then(s => { if (!active) return; if (s.generationStatus !== 'completed') throw new Error(s.generationError || 'A geração ainda não foi concluída. Volte ao CRM para acompanhar.'); const d = toDocument(s); latest.current = d; revision.current = s.revision; saved.current = JSON.stringify(d); setDoc(d); setSite(s); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);
  const change = (next: SiteDocument) => { const previous = latest.current; if (previous) setHistory(h => [...h.slice(-39), previous]); setFuture([]); latest.current = next; setDoc(next); setSaveState('Alterações pendentes'); };
  const persist = useCallback(async (publish = false) => {
    const previous = saving.current ?? Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      const d = latest.current; if (!d) return;
      const snapshot = JSON.stringify(d); if (!publish && snapshot === saved.current) return;
      setSaveState(publish ? 'Publicando...' : 'Salvando...');
      try {
        const result = await postData<Website>(`/websites/${id}/${publish ? 'publish' : 'save'}`, { revision: revision.current, document: d });
        revision.current = result.revision; saved.current = snapshot; setSite(result); setError(''); setSaveState(JSON.stringify(latest.current) === snapshot ? 'Salvo' : 'Alterações pendentes');
      } catch (e) { setSaveState('Falha ao salvar'); setError(e instanceof Error ? e.message : 'Erro ao salvar'); throw e; }
    });
    saving.current = task;
    try { await task; } finally { if (saving.current === task) saving.current = null; }
  }, [id]);
  useEffect(() => { if (!doc) return; const timer = setTimeout(() => { void persist().catch(() => {}); }, 900); return () => clearTimeout(timer); }, [doc, persist]);
  useEffect(() => () => { void persist().catch(() => {}); }, [persist]);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (latest.current && saved.current !== JSON.stringify(latest.current)) { e.preventDefault(); } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, []);
  const select = (sectionId: string, field?: string) => { setSelected(sectionId); if (field) setTimeout(() => document.querySelector<HTMLElement>(`[data-editor-field="${field}"]`)?.focus(), 30); };
  const undo = () => { const d = history.at(-1); if (!d || !doc) return; setFuture(f => [doc, ...f]); setHistory(h => h.slice(0, -1)); latest.current = d; setDoc(d); };
  const redo = () => { const d = future[0]; if (!d || !doc) return; setHistory(h => [...h, doc]); setFuture(f => f.slice(1)); latest.current = d; setDoc(d); };
  const move = (from: number, to: number) => { if (!doc || to < 0 || to >= doc.sections.length || from === to) return; const sections = [...doc.sections]; sections.splice(to, 0, sections.splice(from, 1)[0]); change({ ...doc, sections }); };
  const add = (type: SectionType, before?: string) => { if (!doc || doc.sections.length >= 60) return; const section = newSection(type); const sections = [...doc.sections]; const index = before ? sections.findIndex(s => s.id === before) : -1; sections.splice(index < 0 ? sections.length : index, 0, section); change({ ...doc, sections }); setSelected(section.id); };
  const publish = async () => { setPublishing(true); try { await persist(true); } catch { /* error is shown beside the canvas */ } finally { setPublishing(false); } };
  const askAi = async () => {
    if (!doc) return; setAiBusy(true); setProposal(null); setAiError('');
    try { const result = await postData<{ document?: SiteDocument; patch?: Partial<SiteContent> }>(`/websites/${id}/rewrite`, { document: doc, sectionId: selected ?? undefined, field: aiField, instruction }); setProposal({ ...result, sectionId: selected }); }
    catch (e) { setAiError(e instanceof Error ? e.message : 'Erro na geração'); } finally { setAiBusy(false); }
  };
  if (!doc) return <div className="studio-loading">{error ? <><p role="alert">{error}</p><Button variant="unstyled" onClick={() => navigate('/crm')}>Voltar ao CRM</Button></> : <><Loader2 className="animate-spin" />Carregando editor...</>}</div>;
  const section = doc.sections.find(s => s.id === selected);
  return <div className={`studio ${preview ? 'studio-preview' : ''}`}>
    <header className="studio-toolbar">
      <ThemeToggle />
      <Button variant="unstyled" title="Voltar aos meus projetos" onClick={async () => { try { await persist(); navigate('/sites'); } catch { /* preserve unsaved edits */ } }}><ArrowLeft size={17} /></Button>
      <Input unstyled aria-label="Nome do projeto" className="studio-project-name" value={doc.name} onChange={e => change({ ...doc, name: e.target.value })} />
      <Button variant="unstyled" title="Desfazer" disabled={!history.length} onClick={undo}><Undo2 size={16} /></Button><Button variant="unstyled" title="Refazer" disabled={!future.length} onClick={redo}><Redo2 size={16} /></Button>
      <span className="studio-save-state" role="status">{saveState === 'Salvo' ? <Check size={13} /> : saveState.includes('...') ? <Loader2 size={13} className="animate-spin" /> : null}{saveState}</span>
      <div className="studio-toolbar-divider" />
      <Button variant="unstyled" className={!interactive ? 'active' : ''} onClick={() => setInteractive(false)}><MousePointer2 size={15} />Editar direto</Button>
      <Button variant="unstyled" className={interactive ? 'active' : ''} onClick={() => setInteractive(true)}><Hand size={15} />Interagir</Button>
      <Button variant="unstyled" onClick={() => { setPreview(!preview); setInteractive(!preview); }}><Eye size={15} />{preview ? 'Voltar ao editor' : 'Visualizar'}</Button>
      <Button variant="unstyled" onClick={() => { setSelected(null); setPreview(false); }}>Ficha / marca</Button>
      <Button variant="unstyled" onClick={() => void persist().catch(() => {})}><Save size={15} />Salvar</Button>
      <Button variant="unstyled" className="studio-publish" disabled={publishing} onClick={() => void publish()}>{publishing ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}Publicar</Button>
      {site?.publishedAt && <a className="studio-public-link" target="_blank" rel="noreferrer" href={`/s/${id}`}>Abrir publicado ↗</a>}
    </header>
    {error && <div className="studio-alert" role="alert">{error}<Button variant="unstyled" onClick={() => setError('')} aria-label="Fechar aviso"><X size={15} /></Button></div>}
    <div className="studio-workspace">
      {!preview && <aside className="studio-left"><div className="studio-panel-heading"><h2>Seções do site</h2><p>Arraste para alterar a ordem</p></div>
        <div className="studio-section-list">{doc.sections.map((s, index) => <div key={s.id} className={`studio-section-row ${selected === s.id ? 'selected' : ''} ${!s.visible ? 'hidden-section' : ''}`} draggable onDragStart={e => { setDragging(s.id); e.dataTransfer.setData('text/plain', s.id); }} onDragEnd={() => setDragging(null)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const type = e.dataTransfer.getData('section-type'); if (type) add(type as SectionType, s.id); else if (dragging) move(doc.sections.findIndex(x => x.id === dragging), index); setDragging(null); }}>
          <Button variant="unstyled" className="studio-section-select" onClick={() => select(s.id)}><GripVertical size={13} /><span>{SECTION_LABELS[s.type]}<small>{s.content.title}</small></span>{!s.visible && <EyeOff size={12} />}</Button>
          {selected === s.id && <div className="studio-section-actions"><Button variant="unstyled" title="Mover para cima" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={13} /></Button><Button variant="unstyled" title="Mover para baixo" disabled={index === doc.sections.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={13} /></Button><Button variant="unstyled" title="Duplicar" disabled={doc.sections.length >= 60} onClick={() => { const copy = { ...structuredClone(s), id: crypto.randomUUID() }; const sections = [...doc.sections]; sections.splice(index + 1, 0, copy); change({ ...doc, sections }); setSelected(copy.id); }}><Copy size={13} /></Button><Button variant="unstyled" title={s.visible ? 'Ocultar' : 'Mostrar'} onClick={() => change({ ...doc, sections: doc.sections.map(x => x.id === s.id ? { ...x, visible: !x.visible } : x) })}>{s.visible ? <Eye size={13} /> : <EyeOff size={13} />}</Button><Button variant="unstyled" title="Excluir seção" disabled={doc.sections.length <= 1} onClick={() => { change({ ...doc, sections: doc.sections.filter(x => x.id !== s.id) }); setSelected(null); }}><Trash2 size={13} /></Button></div>}
        </div>)}</div>
        <div className="studio-panel-heading"><Button variant="unstyled" className="studio-add-title" onClick={() => setAddOpen(!addOpen)}><Plus size={16} />Adicionar seção</Button><p>Escolha ou arraste uma seção para o site</p></div>
        {addOpen && <div className="studio-catalog">{Object.entries(SECTION_LABELS).map(([type, label]) => <Button variant="unstyled" key={type} draggable onDragStart={e => e.dataTransfer.setData('section-type', type)} onClick={() => add(type as SectionType)}>{label}<GripVertical size={12} /></Button>)}</div>}
      </aside>}
      <div className="studio-center"><div className="studio-viewport-toolbar"><div className="studio-device-buttons">{([[390, Smartphone, 'Celular'], [768, Tablet, 'Tablet'], [1200, Monitor, 'Desktop']] as const).map(([w, Icon, label]) => <Button variant="unstyled" key={w} className={width === w ? 'active' : ''} title={label} aria-label={label} onClick={() => setWidth(w)}><Icon size={17} /></Button>)}</div><span className="studio-toolbar-divider" /><Select aria-label="Zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[0.5, 0.65, 0.8, 1].map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}</Select><span className="studio-draft-label">{site?.publishedAt ? 'Rascunho · publicação disponível' : 'Rascunho'}</span></div>
        <div className="studio-canvas-scroll" onDragOver={e => e.preventDefault()} onDrop={e => { const type = e.dataTransfer.getData('section-type'); if (type) add(type as SectionType); }}><div className="studio-canvas-size" style={{ width: width * zoom, height: `calc((100vh - 155px) * ${zoom})` }}><div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width }}><WebsiteFrame document={doc} width={width} selectedId={selected} interactive={interactive} onSelect={select} /></div></div></div>
      </div>
      {!preview && <aside className="studio-right"><div className="studio-panel-heading"><h2>{section ? SECTION_LABELS[section.type] : 'Site'}</h2>{section && <Button variant="unstyled" className="studio-text-button" onClick={() => setSelected(null)}>Configurações do site</Button>}</div>{section ? <SectionFields section={section} onChange={next => change({ ...doc, sections: doc.sections.map(s => s.id === next.id ? next : s) })} /> : <SiteFields document={doc} onChange={change} />}</aside>}
    </div>
    <Button variant="unstyled" className="studio-ai-button" onClick={() => { setAiOpen(true); setAiField(selected ? 'title' : 'structure'); setProposal(null); }}><Sparkles size={17} />Pedir à IA</Button>
    {aiOpen && <div className="studio-modal-backdrop"><div className="studio-ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-title"><div className="studio-modal-heading"><h2 id="ai-title"><Sparkles size={20} />Assistente do site</h2><Button variant="unstyled" disabled={aiBusy} aria-label="Fechar" onClick={() => setAiOpen(false)}><X size={19} /></Button></div><p>Revise a sugestão antes de aplicar ao rascunho.</p><label className="studio-field"><span>O que deseja criar?</span><Select value={aiField} disabled={aiBusy} onChange={e => { setAiField(e.target.value); setProposal(null); }}>{selected && <><option value="title">Nova headline</option><option value="subtitle">Nova descrição</option><option value="text">Melhorar texto</option><option value="section">Reescrever seção</option></>}<option value="structure">Gerar outra estrutura do site</option></Select></label><TextField label="Instruções (opcional)" value={instruction} onChange={setInstruction} multiline />
      {aiField === 'structure' && <p>Ao aplicar, a nova estrutura substituirá as seções do rascunho. Você poderá desfazer no editor.</p>}
      {aiError && <p role="alert" className="studio-error">{aiError}</p>}
      {proposal && <div className="studio-ai-proposal">{proposal.document ? <><h3>Nova estrutura</h3>{proposal.document.sections.map(s => <p key={s.id}><strong>{SECTION_LABELS[s.type]}</strong> · {s.content.title}</p>)}</> : Object.entries(proposal.patch || {}).map(([key, value]) => <div key={key}><small>{({ title: 'Título', subtitle: 'Subtítulo', text: 'Texto', eyebrow: 'Linha pequena' } as Record<string, string>)[key]}</small><p>{String(value)}</p></div>)}</div>}
      <div className="studio-modal-actions"><Button variant="unstyled" className="studio-outline" disabled={aiBusy} onClick={() => void askAi()}>{aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{aiBusy ? 'Criando sugestão...' : 'Gerar sugestão'}</Button>{proposal && <Button variant="unstyled" className="studio-publish" onClick={() => { if (proposal.document) change(proposal.document); else change({ ...doc, sections: doc.sections.map(s => s.id === proposal.sectionId ? { ...s, content: { ...s.content, ...proposal.patch } } : s) }); setAiOpen(false); setProposal(null); }}>Aplicar sugestão</Button>}</div>
    </div></div>}
  </div>;
}
