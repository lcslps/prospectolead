import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Phone, MessageCircle, X } from 'lucide-react';
import { PageHeader, Card } from '../../components/layout';
import { listCrmLeads, createManualLead, deleteCrmLead } from '../../lib/leads';
import { fetchNiches } from '../../lib/geo';
import type { Lead, LeadStage, NicheOption } from '../../types';
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
          <select
            className="w-full border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13.5px]"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          >
            <option value="">Nicho</option>
            {niches.map((n) => (
              <option key={n.value} value={n.label}>
                {n.label}
              </option>
            ))}
          </select>
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

export default function Crm({ backendUrl }: Props) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [filter, setFilter] = useState<FilterId>('todos');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

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
  }

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

            <div className="space-y-3 min-h-[80px]">
              {grouped[stage].length === 0 && (
                <div className="text-[12px] text-[#9aa0ab] text-center py-6 bg-[#f7f8fa] rounded-[12px]">
                  Sem leads
                </div>
              )}
              {grouped[stage].map((lead) => {
                const tierColor = TIER_COLORS[lead.tier];
                return (
                  <Card key={lead.id} className="p-3.5 cursor-pointer hover:shadow-md transition-shadow">
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

                    <div onClick={() => navigate(`/crm/${lead.id}`)}>
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
                        className="flex-1 flex items-center justify-center gap-1 border border-[#d4d9e0] rounded-[8px] py-1.5 text-[11.5px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                      >
                        <Phone size={12} /> Ligar
                      </a>
                      <a
                        href={whatsappHref(lead.phone)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1 border border-[#d4d9e0] rounded-[8px] py-1.5 text-[11.5px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewLeadModal niches={niches} onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
