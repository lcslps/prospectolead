import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles, Save } from 'lucide-react';
import { Card } from '../../components/layout';
import { getCrmLead, updateCrmLead } from '../../lib/leads';
import type { Lead, LeadStage, LeadStatus } from '../../types';
import { CRM_STAGES, TIER_COLORS } from '../../types';

interface Props {
  backendUrl: string;
}

const TABS = ['Informações', 'Notas', 'Roteiros', 'Objeções', 'Site', 'Venda', 'Agendar'] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS: LeadStatus[] = ['Em aberto', 'Ganho', 'Perdido'];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-[#eef0f3] last:border-b-0 gap-1">
      <span className="text-[13px] text-[#5f6570]">{label}</span>
      <div className="text-[13.5px] text-[#1a1d21] sm:text-right">{children}</div>
    </div>
  );
}

export default function LeadDetail({ backendUrl }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [tab, setTab] = useState<Tab>('Informações');
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!id) return;
    try {
      const l = await getCrmLead(backendUrl, id);
      setLead(l);
      setNotesDraft(l.notes || '');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, backendUrl]);

  async function patch(fields: Partial<Lead>) {
    if (!lead) return;
    const updated = await updateCrmLead(backendUrl, lead.id, fields);
    setLead(updated);
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await patch({ notes: notesDraft });
    } finally {
      setSavingNotes(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-7">
        <p className="text-[#d64545] text-[13.5px]">{error}</p>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-7">
        <p className="text-[#9aa0ab] text-[13.5px]">Carregando...</p>
      </div>
    );
  }

  const tierColor = TIER_COLORS[lead.tier];
  const googleUrl =
    lead.googleMapsUri || (lead.placeId ? `https://www.google.com/maps/place/?q=place_id:${lead.placeId}` : '');

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-7 pb-20">
      <button
        onClick={() => navigate('/crm')}
        className="flex items-center gap-1.5 text-[13px] text-[#5f6570] hover:text-[#1a1d21] mb-4"
      >
        <ArrowLeft size={15} /> CRM / <span className="text-[#1a1d21] font-medium">{lead.name}</span>
      </button>

      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <span
            className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
          >
            {lead.score}
          </span>
          <span
            className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
          >
            {lead.tier}
          </span>
          <h1 className="text-[19px] font-semibold text-[#1a1d21] ml-1">{lead.name}</h1>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-[#e4e7ec] mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'px-3.5 py-2.5 text-[13.5px] border-b-2 -mb-px ' +
                (tab === t ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-[#5f6570]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Informações' && (
          <div>
            <Row label="Categoria">{lead.niche || '—'}</Row>
            <Row label="Cidade">
              {lead.city}
              {lead.state ? `, ${lead.state}` : ''}
            </Row>
            <Row label="Telefone">
              {lead.phone || '—'}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="text-blue-600 ml-2 font-medium">
                  Ligar
                </a>
              )}
            </Row>
            <Row label="Endereço">{lead.address || '—'}</Row>
            <Row label="Avaliação">
              {lead.rating !== null ? `${lead.rating.toFixed(1)}/5 · ${lead.reviewCount} avaliações` : '—'}
            </Row>
            <Row label="Etapa">
              <div className="flex flex-wrap gap-1.5 justify-end">
                {CRM_STAGES.map((s: LeadStage) => (
                  <button
                    key={s}
                    onClick={() => patch({ stage: s })}
                    className={
                      'px-2.5 py-1 rounded-full text-[11.5px] border ' +
                      (lead.stage === s
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'border-[#d4d9e0] text-[#5f6570]')
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Row>
            {googleUrl && (
              <Row label="Google Meu Negócio">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-medium"
                >
                  <ExternalLink size={13} /> Ver no Google
                </a>
              </Row>
            )}
            <Row label="Status">
              <div className="flex gap-1.5 justify-end">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch({ status: s })}
                    className={
                      'px-3 py-1 rounded-full text-[11.5px] border ' +
                      (lead.status === s
                        ? 'bg-[#1a1d21] text-white border-[#1a1d21] font-semibold'
                        : 'border-[#d4d9e0] text-[#5f6570]')
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Site">
              {lead.siteUrl ? (
                <a
                  href={backendUrl.replace(/\/$/, '') + lead.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-medium"
                >
                  Ver site gerado
                </a>
              ) : lead.hasSite && lead.websiteUrl ? (
                <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-medium">
                  {lead.websiteUrl}
                </a>
              ) : (
                <span className="text-[#9aa0ab]">Sem site</span>
              )}
            </Row>
          </div>
        )}

        {tab === 'Notas' && (
          <div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Anotações sobre a conversa, contexto, próximos passos..."
              className="w-full min-h-[220px] border border-[#d4d9e0] rounded-[10px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#5b8cff] resize-y"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-3 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] px-4 py-2.5 text-[13px]"
            >
              <Save size={14} /> {savingNotes ? 'Salvando...' : 'Salvar notas'}
            </button>
          </div>
        )}

        {tab === 'Site' && (
          <div className="text-center py-8">
            {lead.siteUrl ? (
              <>
                <p className="text-[13.5px] text-[#5f6570] mb-4">Este lead já tem um site gerado.</p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={backendUrl.replace(/\/$/, '') + lead.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-[#d4d9e0] rounded-[10px] px-4 py-2.5 text-[13.5px] font-medium hover:bg-[#f4f6f9]"
                  >
                    Ver site gerado
                  </a>
                  <button
                    onClick={() => navigate(`/criar?leadId=${lead.id}`)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-4 py-2.5 text-[13.5px]"
                  >
                    <Sparkles size={16} /> Gerar novamente
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13.5px] text-[#5f6570] mb-4">
                  Nenhum site foi gerado ainda para {lead.name}. Os dados deste lead serão usados
                  automaticamente — não é preciso digitar nada.
                </p>
                <button
                  onClick={() => navigate(`/criar?leadId=${lead.id}`)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-5 py-3 text-[14px]"
                >
                  <Sparkles size={17} /> Gerar site para este lead
                </button>
              </>
            )}
          </div>
        )}

        {(tab === 'Roteiros' || tab === 'Objeções' || tab === 'Venda' || tab === 'Agendar') && (
          <div className="text-center py-12 text-[13.5px] text-[#9aa0ab]">
            Em breve. Por enquanto, use a aba <b className="text-[#5f6570]">Notas</b> para registrar o que for
            importante sobre {tab.toLowerCase()}.
          </div>
        )}
      </Card>
    </div>
  );
}
