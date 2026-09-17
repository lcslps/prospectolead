import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Phone,
  Globe,
  MapPin,
  Star,
  MessageSquareText,
  CalendarClock,
  StickyNote,
  FolderOpen,
  Trash2,
  ExternalLink,
  Flame,
  Save,
  Clock,
} from 'lucide-react';
import type { CrmLeadFull, CrmStage } from '../../types';
import { CRM_STAGE_LABELS, CRM_PIPELINE_STAGES as CRM_STAGE_ORDER, CRM_STAGE_STYLES, toDatetimeLocalValue, formatCrmDate, whatsAppLink } from '../../lib/utils';
import { getData } from '../../services/api';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { useToast } from '../Toast';
import { MessageGeneratorModal } from '../MessageGeneratorModal';
import { CRMActivityTimeline } from './CRMActivityTimeline';
import { LeadWebsite } from '../LeadWebsite';

interface CRMLeadDrawerProps {
  open: boolean;
  crmLeadId: string | null;
  onClose: () => void;
  onStageChange: (id: string, stage: CrmStage) => Promise<CrmLeadFull>;
  onNoteAdd: (id: string, desc: string) => Promise<CrmLeadFull>;
  onFollowUpSet: (id: string, value: string | null) => Promise<CrmLeadFull>;
  onLastContactSet: (id: string) => Promise<CrmLeadFull>;
  onMessageSent: (id: string) => Promise<CrmLeadFull>;
  onRemove: (id: string) => Promise<void>;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800/60">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{children}</span>
    </div>
  );
}

export function CRMLeadDrawer({
  open,
  crmLeadId,
  onClose,
  onStageChange,
  onNoteAdd,
  onFollowUpSet,
  onLastContactSet,
  onMessageSent,
  onRemove,
}: CRMLeadDrawerProps) {
  const [detail, setDetail] = useState<CrmLeadFull | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [followUpValue, setFollowUpValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const toast = useToast();

  const refresh = useCallback(
    async (id: string) => {
      try {
        const data = await getData<CrmLeadFull>(`/crm/leads/${id}`);
        setDetail(data);
        setFollowUpValue(toDatetimeLocalValue(data.nextFollowUpAt));
        setNoteInput(data.notes ?? '');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao carregar lead');
      }
    },
    [toast],
  );

  useEffect(() => {
    if (open && crmLeadId) {
      setDetail(null);
      refresh(crmLeadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, crmLeadId]);

  const run = async <T,>(op: () => Promise<T>) => {
    if (busy) return;
    setBusy(true);
    try {
      await op();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na operação');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  if (!detail) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
        <aside className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900">
          <Spinner />
        </aside>
      </div>
    );
  }

  const lead = detail.lead;
  const wa = whatsAppLink(lead.telefone, lead.telefoneInternacional);
  const activityCount = detail.activities?.length ?? 0;
  const originCampaign = lead.campaigns[0]?.campaign;

  const handleStageClick = (stage: CrmStage) =>
    run(async () => {
      if (stage === detail.stage) return;
      const updated = await onStageChange(detail.id, stage);
      setDetail(updated);
      setFollowUpValue(toDatetimeLocalValue(updated.nextFollowUpAt));
      toast.success(`Movido para ${CRM_STAGE_LABELS[stage]}`);
    });

  const handleAddNote = () =>
    run(async () => {
      if (!noteInput.trim()) {
        toast.error('Escreva uma observação');
        return;
      }
      const updated = await onNoteAdd(detail.id, noteInput.trim());
      setDetail(updated);
      setNoteInput(updated.notes ?? '');
      toast.success('Observação adicionada');
    });

  const handleFollowUpSave = () =>
    run(async () => {
      const updated = await onFollowUpSet(detail.id, followUpValue ? new Date(followUpValue).toISOString() : null);
      setDetail(updated);
      setFollowUpValue(toDatetimeLocalValue(updated.nextFollowUpAt));
      toast.success(followUpValue ? 'Follow-up agendado' : 'Follow-up removido');
    });

  const handleLastContact = () =>
    run(async () => {
      const updated = await onLastContactSet(detail.id);
      setDetail(updated);
      toast.success('Último contato atualizado');
    });

  const handleMessageSent = () =>
    run(async () => {
      const updated = await onMessageSent(detail.id);
      setDetail(updated);
      toast.success('Marcado como mensagem enviada');
    });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{lead.nome}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`badge ring-1 ${CRM_STAGE_STYLES[detail.stage]}`}>{CRM_STAGE_LABELS[detail.stage]}</span>
              {lead.cidade && <span>{lead.cidade}{lead.estado ? `/${lead.estado}` : ''}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            <Button className="w-full" onClick={() => setMessageModal(true)} size="sm">
              <MessageSquareText className="h-4 w-4" /> Abrir WhatsApp / Gerar mensagem
            </Button>
            <Button variant="secondary" className="w-full" size="sm" onClick={handleMessageSent} disabled={busy || detail.stage === 'MESSAGE_SENT'}>
              <ExternalLink className="h-4 w-4" /> Marcar como mensagem enviada
            </Button>
          </div>

          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Mover para etapa</div>
            <div className="flex flex-wrap gap-1.5">
              {CRM_STAGE_ORDER.map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleStageClick(stage)}
                  disabled={busy}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                    detail.stage === stage
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {CRM_STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </div>

          <LeadWebsite key={detail.id} crmLeadId={detail.id} />
          <div className="rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
              Informações
            </div>
            <div className="px-4 pb-2">
              <InfoRow label="Nicho / Categoria">{lead.nicho ?? lead.categoria ?? '—'}</InfoRow>
              <InfoRow label="Endereço">{lead.endereco ?? '—'}</InfoRow>
              <InfoRow label="Telefone">
                {lead.telefone ? (
                  <a href={wa ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
                    <Phone className="h-3.5 w-3.5" /> {lead.telefone}
                  </a>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Site">
                {lead.site ? (
                  <a href={lead.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-brand-600 dark:text-brand-400">
                    <Globe className="h-3.5 w-3.5" /> {lead.site}
                  </a>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Google Maps">
                {lead.googleMapsUrl ? (
                  <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
                    <MapPin className="h-3.5 w-3.5" /> Abrir no Google Maps
                  </a>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Nota">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <RatingLabel nota={lead.nota} avaliacoes={lead.quantidadeAvaliacoes} />
                </span>
              </InfoRow>
              <InfoRow label="Lead Score">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-4 w-4 text-amber-500" /> {lead.leadScore} / 100
                </span>
              </InfoRow>
              {originCampaign && (
                <InfoRow label="Campanha de origem">
                  <span className="inline-flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5 text-slate-400" /> {originCampaign.nome}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Entrada no CRM">{formatCrmDate(detail.createdAt)}</InfoRow>
              <InfoRow label="Último contato">{formatCrmDate(detail.lastContactAt)}</InfoRow>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Próximo follow-up</div>
              {detail.nextFollowUpAt && (
                <Button variant="ghost" size="xs" onClick={() => run(async () => { const up = await onFollowUpSet(detail.id, null); setDetail(up); setFollowUpValue(''); toast.success('Follow-up removido'); })}>
                  Limpar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={followUpValue}
                onChange={(e) => setFollowUpValue(e.target.value)}
              />
              <Button size="sm" onClick={handleFollowUpSave} disabled={busy}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
            {detail.nextFollowUpAt && (
              <p className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400">
                <CalendarClock className="h-3.5 w-3.5" /> {formatCrmDate(detail.nextFollowUpAt)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Observações</div>
              <Button variant="ghost" size="xs" onClick={handleLastContact} disabled={busy}>
                <Clock className="h-3.5 w-3.5" /> Registrar contato
              </Button>
            </div>
            <Textarea
              className="min-h-[90px]"
              placeholder="Anote o resultado do contato..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <Button variant="secondary" size="sm" className="w-full" onClick={handleAddNote} disabled={busy || !noteInput.trim()}>
              <StickyNote className="h-4 w-4" /> Adicionar observação
            </Button>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Histórico de atividades ({activityCount})
            </div>
            <CRMActivityTimeline activities={detail.activities} />
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          {confirmRemove ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-red-600">Remover do CRM?</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    run(async () => {
                      await onRemove(detail.id);
                      toast.success('Lead removido do CRM');
                      onClose();
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" /> Confirmar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" className="w-full" size="sm" onClick={() => setConfirmRemove(true)} disabled={busy}>
              <Trash2 className="h-4 w-4" /> Remover do CRM
            </Button>
          )}
        </div>
      </aside>

      <MessageGeneratorModal
        open={messageModal}
        onClose={() => setMessageModal(false)}
        leadIds={detail.leadId ? [detail.leadId] : []}
        leadRef={{ telefone: lead.telefone, telefoneInternacional: lead.telefoneInternacional }}
      />
    </div>
  );
}

function RatingLabel({ nota, avaliacoes }: { nota: number | null; avaliacoes: number | null }) {
  return (
    <span>
      {nota !== null && nota !== undefined ? `${nota.toFixed(1).replace('.', ',')}` : '—'}
      {avaliacoes ? ` · ${avaliacoes} avaliações` : ''}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
