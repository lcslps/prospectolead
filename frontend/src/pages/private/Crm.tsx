import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Phone, MessageCircle, X, ExternalLink, Sparkles, Save } from 'lucide-react';
import { PageHeader, Card } from '../../components/layout';
import Select from '../../components/Select';
import { listCrmLeads, createManualLead, deleteCrmLead, getCrmLead, updateCrmLead } from '../../lib/leads';
import { fetchNiches } from '../../lib/geo';
import type { Lead, LeadStage, LeadStatus, NicheOption } from '../../types';
import { CRM_STAGES, STAGE_COLORS, TIER_COLORS } from '../../types';

interface Props {
  backendUrl: string;
}

type FilterId = 'todos' | 'sem_site' | 'tier3' | 'tier2' | 'score50' | 'com_telefone';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'sem_site', label: 'Sem site' },
  { id: 'tier3', label: 'Tier 3 (Quente)' },
  { id: 'tier2', label: 'Tier 2 (Morno)' },
  { id: 'score50', label: 'Score 50+' },
  { id: 'com_telefone', label: 'Com telefone' },
];

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/55${digits}`;
}

function NewLeadModal({
  niches,
  onClose,
  onCreate,
}: {
  niches: NicheOption[];
  onClose: () => void;
  onCreate: (data: Partial<Lead>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({ name, niche, city, phone });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <Card className="w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[15px]">Criar lead manual</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            className="w-full border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13.5px]"
            placeholder="Nome da empresa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            value={niche}
            onChange={setNiche}
            options={[{ value: '', label: 'Nicho' }, ...niches.map((n) => ({ value: n.label, label: n.label }))]}
            placeholder="Nicho"
            searchable
            searchPlaceholder="Buscar ou digitar nicho..."
            creatable
          />
          <input
            className="w-full border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13.5px]"
            placeholder="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="w-full border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13.5px]"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] py-2.5 text-[13.5px]"
        >
          {saving ? 'Salvando...' : 'Salvar lead'}
        </button>
      </Card>
    </div>
  );
}

const POPUP_TABS = ['Informações', 'Notas', 'Site'] as const;
type PopupTab = (typeof POPUP_TABS)[number];

const POPUP_STATUS: LeadStatus[] = ['Em aberto', 'Ganho', 'Perdido'];

function PopupRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-[#eef0f3] last:border-b-0">
      <span className="text-[11.5px] text-[#9aa0ab]">{label}</span>
      <div className="text-[13.5px] text-[#1a1d21]">{children}</div>
    </div>
  );
}

function LeadPopup({
  lead,
  side,
  top,
  left,
  backendUrl,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  side: 'left' | 'right';
  top: number;
  left: number;
  backendUrl: string;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
}) {
  const navigate = useNavigate();
  const [full, setFull] = useState<Lead>(lead);
  const [tab, setTab] = useState<PopupTab>('Informações');
  const [notesDraft, setNotesDraft] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getCrmLead(backendUrl, lead.id)
      .then((l) => {
        if (!alive) return;
        setFull(l);
        setNotesDraft(l.notes || '');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [backendUrl, lead.id]);

  // Reflete no popup mudanças vindas do kanban (ex: arrasto de coluna)
  useEffect(() => {
    setFull(lead);
  }, [lead]);

  async function patch(fields: Partial<Lead>) {
    const updated = await updateCrmLead(backendUrl, full.id, fields);
    setFull(updated);
    onUpdated(updated);
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await patch({ notes: notesDraft });
    } finally {
      setSaving(false);
    }
  }

  const tierColor = TIER_COLORS[full.tier];
  const googleUrl =
    full.googleMapsUri || (full.placeId ? `https://www.google.com/maps/place/?q=place_id:${full.placeId}` : '');

  return (
    <div className="fixed z-50 w-[400px] max-w-[calc(100vw-24px)]" style={{ top, left }}>
      <Card className="relative p-5 max-h-[calc(100vh-120px)] overflow-y-auto shadow-[0_12px_40px_rgba(16,24,40,0.18)]">
        <span
          className={
            'absolute top-12 w-3.5 h-3.5 rotate-45 bg-white ' +
            (side === 'right' ? '-left-2 border-l border-b border-[#e4e7ec]' : '-right-2 border-r border-t border-[#e4e7ec]')
          }
        />
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
          >
            {full.score}
          </span>
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
          >
            {full.tier}
          </span>
          <button onClick={onClose} className="ml-auto text-[#9aa0ab] hover:text-[#1a1d21]">
            <X size={16} />
          </button>
        </div>

        <h3 className="text-[16px] font-semibold text-[#1a1d21] leading-snug">{full.name}</h3>
        <p className="text-[12px] text-[#9aa0ab] mb-3">
          {full.niche}
          {full.city ? ` · ${full.city}` : ''}
        </p>

        <div className="flex gap-1 border-b border-[#e4e7ec] mb-3">
          {POPUP_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'px-3 py-2 text-[12.5px] border-b-2 -mb-px ' +
                (tab === t ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-[#5f6570]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Informações' && (
          <div>
            <PopupRow label="Etapa">
              <div className="flex flex-wrap gap-1.5">
                {CRM_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch({ stage: s })}
                    className={
                      'px-2.5 py-1 rounded-full text-[11px] border ' +
                      (full.stage === s
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'border-[#d4d9e0] text-[#5f6570]')
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </PopupRow>
            <PopupRow label="Telefone">
              {full.phone || '—'}
              {full.phone && (
                <a href={`tel:${full.phone}`} className="text-blue-600 ml-2 font-medium">
                  Ligar
                </a>
              )}
            </PopupRow>
            <PopupRow label="Endereço">{full.address || '—'}</PopupRow>
            <PopupRow label="Avaliação">
              {full.rating !== null ? `${full.rating.toFixed(1)}/5 · ${full.reviewCount} avaliações` : '—'}
            </PopupRow>
            {googleUrl && (
              <PopupRow label="Google Meu Negócio">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-medium"
                >
                  <ExternalLink size={13} /> Ver no Google
                </a>
              </PopupRow>
            )}
            <PopupRow label="Status">
              <div className="flex gap-1.5">
                {POPUP_STATUS.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch({ status: s })}
                    className={
                      'px-3 py-1 rounded-full text-[11px] border ' +
                      (full.status === s
                        ? 'bg-[#1a1d21] text-white border-[#1a1d21] font-semibold'
                        : 'border-[#d4d9e0] text-[#5f6570]')
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </PopupRow>
          </div>
        )}

        {tab === 'Notas' && (
          <div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Anotações sobre a conversa, próximos passos..."
              className="w-full min-h-[140px] border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13px] outline-none focus:border-[#5b8cff] resize-y"
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] px-4 py-2 text-[12.5px]"
            >
              <Save size={13} /> {saving ? 'Salvando...' : 'Salvar notas'}
            </button>
          </div>
        )}

        {tab === 'Site' && (
          <div className="text-center py-5">
            {full.siteUrl ? (
              <>
                <p className="text-[13px] text-[#5f6570] mb-3">Este lead já tem um site gerado.</p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={backendUrl.replace(/\/$/, '') + full.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-[#d4d9e0] rounded-[10px] px-3.5 py-2 text-[12.5px] font-medium hover:bg-[#f4f6f9]"
                  >
                    Ver site
                  </a>
                  <button
                    onClick={() => navigate(`/criar?leadId=${full.id}`)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-3.5 py-2 text-[12.5px]"
                  >
                    <Sparkles size={14} /> Gerar novamente
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] text-[#5f6570] mb-3">
                  Nenhum site gerado ainda. Os dados deste lead entram automaticamente.
                </p>
                <button
                  onClick={() => navigate(`/criar?leadId=${full.id}`)}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-4 py-2.5 text-[13px]"
                >
                  <Sparkles size={15} /> Gerar site para este lead
                </button>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Crm({ backendUrl }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [filter, setFilter] = useState<FilterId>('todos');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; side: 'left' | 'right' } | null>(null);
  const dragEndAt = useRef(0);
  const draggedLeadId = useRef<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params: Parameters<typeof listCrmLeads>[1] = { q: q || undefined };
      if (filter === 'sem_site') params.hasSite = 'false';
      if (filter === 'tier3') params.tier = 'Quente';
      if (filter === 'tier2') params.tier = 'Morno';
      if (filter === 'score50') params.minScore = 50;
      if (filter === 'com_telefone') params.hasPhone = 'true';
      const data = await listCrmLeads(backendUrl, params);
      setLeads(data.leads);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNiches(backendUrl).then(setNiches).catch(() => {});
  }, [backendUrl]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, backendUrl]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const grouped = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = {
      Base: [],
      Abordado: [],
      Agendado: [],
      'Follow Up': [],
      Convertido: [],
      Perdido: [],
    };
    for (const lead of leads) {
      if (map[lead.stage]) map[lead.stage].push(lead);
    }
    return map;
  }, [leads]);

  async function handleCreate(data: Partial<Lead>) {
    await createManualLead(backendUrl, data);
    load();
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover este lead do CRM?')) return;
    await deleteCrmLead(backendUrl, id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selected?.id === id) closeLead();
  }

  async function moveLead(id: string, toStage: LeadStage) {
    const current = leads.find((l) => l.id === id);
    if (!current || current.stage === toStage) return;
    const fromStage = current.stage;
    setMovingId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: toStage } : l)));
    setSelected((prev) => (prev?.id === id ? { ...prev, stage: toStage } : prev));
    try {
      const updated = await updateCrmLead(backendUrl, id, { stage: toStage });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setSelected((prev) => (prev?.id === id ? updated : prev));
    } catch (e) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: fromStage } : l)));
      setSelected((prev) => (prev?.id === id ? { ...prev, stage: fromStage } : prev));
      setError((e as Error).message || 'Falha ao mover o lead. Tente de novo.');
    } finally {
      setMovingId(null);
      setDragId(null);
      setDragOverStage(null);
    }
  }

  function startDrag(event: React.DragEvent<HTMLDivElement>, id: string) {
    draggedLeadId.current = id;
    event.dataTransfer.setData('application/x-prospectolead-lead', id);
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  }

  function dropInStage(event: React.DragEvent<HTMLDivElement>, stage: LeadStage) {
    event.preventDefault();
    const id =
      event.dataTransfer.getData('application/x-prospectolead-lead') ||
      event.dataTransfer.getData('text/plain') ||
      draggedLeadId.current ||
      dragId;
    if (id) moveLead(id, stage);
  }

  function endDrag() {
    dragEndAt.current = Date.now();
    draggedLeadId.current = null;
    setDragId(null);
    setDragOverStage(null);
  }

  function openLead(lead: Lead, anchor: HTMLElement) {
    // Ignora o clique fantasma que o navegador dispara logo após um arrasto
    if (Date.now() - dragEndAt.current < 400) return;
    const rect = anchor.getBoundingClientRect();
    const POPUP_W = 400;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let side: 'left' | 'right';
    let left: number;
    if (rect.left + rect.width / 2 < vw / 2) {
      // Card à esquerda → popup abre à direita
      side = 'right';
      left = rect.right + 12;
      if (left + POPUP_W > vw - 12) left = Math.max(12, vw - POPUP_W - 12);
    } else {
      // Card à direita → popup abre à esquerda
      side = 'left';
      left = rect.left - POPUP_W - 12;
      if (left < 12) left = 12;
    }
    const top = Math.max(12, Math.min(rect.top - 24, vh - 200));
    setSelected(lead);
    setPopupPos({ left, top, side });
  }

  function closeLead() {
    setSelected(null);
    setPopupPos(null);
  }

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLead();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  function exportCsv() {
    const rows = [
      ['Nome', 'Nicho', 'Cidade', 'Telefone', 'Score', 'Tier', 'Etapa'],
      ...leads.map((l) => [l.name, l.niche, l.city, l.phone, String(l.score), l.tier, l.stage]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'crm-leads.csv';
    a.click();
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-7 pb-20">
      <PageHeader title="CRM" description="Filtre, priorize e gerencie o contato com cada lead" />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, categoria, cidade ou telefone..."
        className="w-full bg-white border border-[#d4d9e0] focus:border-[#5b8cff] rounded-[12px] px-4 py-3 text-[13.5px] outline-none mb-4"
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={
              'px-3.5 py-2 rounded-lg text-[13px] font-medium ' +
              (filter === f.id ? 'bg-blue-600 text-white' : 'bg-[#f1f3f6] text-[#1a1d21] hover:bg-[#e8ebf0]')
            }
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-3.5 py-2 text-[13px]"
          >
            <Plus size={15} /> Criar lead
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 border border-[#d4d9e0] rounded-[10px] px-3.5 py-2 text-[13px] hover:bg-[#f4f6f9]"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {error && <div className="text-[12.5px] text-[#d64545] mb-3">{error}</div>}
      {loading && <div className="text-[12.5px] text-[#9aa0ab] mb-3">Carregando...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {CRM_STAGES.map((stage) => (
          <div key={stage}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
              <h3 className="text-[13.5px] font-semibold text-[#1a1d21]">{stage}</h3>
              <span className="ml-auto text-[12px] text-[#9aa0ab]">{grouped[stage].length}</span>
            </div>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                if (dragOverStage !== stage) setDragOverStage(stage);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverStage !== stage) setDragOverStage(stage);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverStage === stage) setDragOverStage(null);
              }}
              onDrop={(e) => dropInStage(e, stage)}
              className={
                'space-y-3 min-h-[160px] rounded-[12px] p-1 -m-1 transition-colors ' +
                (dragOverStage === stage ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : '')
              }
            >
              {grouped[stage].length === 0 && (
                <div className="text-[12px] text-[#9aa0ab] text-center py-6 bg-[#f7f8fa] rounded-[12px] border border-dashed border-[#d4d9e0]">
                  {dragOverStage === stage ? 'Solte aqui' : 'Sem leads — arraste para cá'}
                </div>
              )}
              {grouped[stage].map((lead) => {
                const tierColor = TIER_COLORS[lead.tier];
                const isDragging = dragId === lead.id;
                return (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => startDrag(e, lead.id)}
                    onDragEnd={endDrag}
                    className={
                      'lead-card p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none ' +
                      (isDragging ? 'opacity-50 ring-2 ring-blue-300' : '') +
                      (movingId === lead.id ? ' opacity-60 pointer-events-none' : '')
                    }
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
                      >
                        {lead.score}
                      </span>
                      <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
                      >
                        {lead.tier}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(lead.id);
                        }}
                        className="ml-auto text-[#9aa0ab] hover:text-[#d64545]"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div
                      onClick={(e) => {
                        const anchor =
                          (e.currentTarget.closest('.lead-card') as HTMLElement) || e.currentTarget;
                        openLead(lead, anchor);
                      }}
                    >
                      <div className="font-semibold text-[13.5px] text-[#1a1d21] leading-snug truncate">
                        {lead.name}
                      </div>
                      <div className="text-[12px] text-[#9aa0ab] mt-0.5">
                        {lead.niche} · {lead.city}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        draggable={false}
                        className="flex-1 flex items-center justify-center gap-1 border border-[#d4d9e0] rounded-[8px] py-1.5 text-[11.5px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                      >
                        <Phone size={12} /> Ligar
                      </a>
                      <a
                        href={whatsappHref(lead.phone)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        draggable={false}
                        className="flex-1 flex items-center justify-center gap-1 border border-[#d4d9e0] rounded-[8px] py-1.5 text-[11.5px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>

                  </Card>
                );
              })}
              {grouped[stage].length > 0 && dragOverStage === stage && (
                <div className="rounded-[10px] border-2 border-dashed border-blue-300 bg-blue-100/70 py-3 text-center text-[12px] font-medium text-blue-700">
                  Solte o lead nesta etapa
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewLeadModal niches={niches} onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      {selected && popupPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeLead} />
          <LeadPopup
            lead={selected}
            side={popupPos.side}
            top={popupPos.top}
            left={popupPos.left}
            backendUrl={backendUrl}
            onClose={closeLead}
            onUpdated={(u) => {
              setLeads((prev) => prev.map((l) => (l.id === u.id ? u : l)));
              setSelected(u);
            }}
          />
        </>
      )}
    </div>
  );
}
