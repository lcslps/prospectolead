import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Map,
  Trash2,
  RefreshCw,
  MessageSquareText,
  Save,
  Star,
  Clock,
} from 'lucide-react';
import { getData, patchData, deleteData, postData } from '../services/api';
import { LEAD_STATUSES, type LeadDetail, type LeadStatus } from '../types';
import { LeadWebsite } from '../components/LeadWebsite';
import { STATUS_LABELS, whatsAppLink, formatDate } from '../lib/utils';
import { PageLoader, EmptyState } from '../components/UI';
import { RatingBadge, ScoreBadge, StatusBadge } from '../components/Badges';
import { ConfirmDialog } from '../components/Modal';
import { MessageGeneratorModal } from '../components/MessageGeneratorModal';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LeadStatus>('NOVO');
  const [observacoes, setObservacoes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getData<LeadDetail>(`/leads/${id}`);
      setLead(data);
      setStatus(data.status);
      setObservacoes(data.observacoes ?? '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar lead');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async () => {
    if (!id || status === lead?.status) return;
    setSavingStatus(true);
    try {
      await patchData<LeadDetail>(`/leads/${id}`, { status });
      toast.success('Status atualizado');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status');
    } finally {
      setSavingStatus(false);
    }
  };

  const saveObservacoes = async () => {
    if (!id) return;
    try {
      await patchData<LeadDetail>(`/leads/${id}`, { observacoes });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      toast.success('Observações salvas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar observações');
    }
  };

  const handleEnrich = async () => {
    if (!id) return;
    setEnriching(true);
    try {
      const result = await postData<{ ok: boolean; updatedFields: string[]; message?: string }>(
        `/leads/${id}/enrich`,
        {},
      );
      if (result.ok) toast.success(`Lead atualizado com ${result.updatedFields.length} campo(s) novos`);
      else toast.info(result.message ?? 'Nenhum dado novo');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enriquecer');
    } finally {
      setEnriching(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setBusyDelete(true);
    try {
      await deleteData<null>(`/leads/${id}`);
      toast.success('Lead excluído');
      navigate('/leads');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
      setBusyDelete(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!lead)
    return <EmptyState title="Lead não encontrado" action={<Link to="/leads" className="btn-secondary">Voltar</Link>} />;

  const wa = whatsAppLink(lead.telefone, lead.telefoneInternacional);
  const originCampaign = lead.campaigns[0]?.campaign;

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800/60">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );

  return (
    <div className="page">
      <div className="workspace-heading">
        <div className="min-w-0">
          <p className="workspace-eyebrow">Comercial / Empresas / Detalhe</p>
          <h2 className="truncate">{lead.nome}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <StatusBadge status={status} />
            <ScoreBadge score={lead.leadScore} />
            {lead.lastEnrichedAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Enriquecido em {formatDate(lead.lastEnrichedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="page-actions">
          <Link
            to="/leads"
            className="btn-secondary !py-2 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Leads
          </Link>
        </div>
      </div>

      <LeadWebsite key={lead.id} crmLeadId={lead.crmLeadId} leadId={lead.id} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="panel-heading">
            <h3 className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-500" /> Informações</h3>
          </div>
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <div>
              {infoRow('Empresa', lead.nome)}
              {infoRow('Categoria', lead.categoria ?? '—')}
              {infoRow('Nicho', lead.nicho ?? '—')}
              {infoRow('Endereço', lead.endereco ?? '—')}
              {infoRow('Cidade', `${lead.cidade ?? '—'}${lead.estado ? ` / ${lead.estado}` : ''}`)}
              {infoRow('CEP', lead.cep ?? '—')}
              {infoRow(
                'Nota',
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <RatingBadge nota={lead.nota} avaliacoes={lead.quantidadeAvaliacoes} />
                </span>,
              )}
            </div>
            <div>
              {infoRow(
                'Telefone',
                lead.telefone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {lead.telefone}
                  </span>
                ) : (
                  '—'
                ),
              )}
              {infoRow(
                'Site',
                lead.site ? (
                  <a
                    href={lead.site}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <Globe className="h-3.5 w-3.5" /> {lead.site}
                  </a>
                ) : (
                  '—'
                ),
              )}
              {infoRow(
                'Google Maps',
                lead.googleMapsUrl ? (
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <Map className="h-3.5 w-3.5" /> Abrir no Google Maps
                  </a>
                ) : (
                  '—'
                ),
              )}
              {infoRow('Latitude / Longitude', lead.latitude !== null ? `${lead.latitude?.toFixed(5)}, ${lead.longitude?.toFixed(5)}` : '—')}
              {infoRow('Criado em', formatDate(lead.createdAt))}
            </div>
          </div>

          {originCampaign && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Campanha de origem: </span>
              <Link to="/campanhas" className="text-brand-600 hover:underline dark:text-brand-400">
                {originCampaign.nome}
              </Link>
              <span className="text-slate-500">
                {' '}({originCampaign.quantidadeEncontrada} encontrados)
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="panel">
            <div className="panel-heading">
              <h3>Status</h3>
            </div>
            <div className="flex gap-2">
              <Select className="flex-1" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
              <Button
                className="!px-3"
                onClick={saveStatus}
                disabled={savingStatus || status === lead.status}
                title="Salvar status"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="btn-primary w-full">
                  <Phone className="h-4 w-4" />
                  ABRIR WHATSAPP
                </a>
              )}
              <Button variant="secondary" className="w-full" onClick={() => setMessageModal(true)}>
                <MessageSquareText className="h-4 w-4" />
                Gerar mensagem
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleEnrich} disabled={enriching}>
                <RefreshCw className={enriching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                {enriching ? 'Enriquecendo...' : 'ENRIQUECER LEAD'}
              </Button>
              <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Excluir lead
              </Button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <h3>Observações</h3>
            </div>
            <Textarea
              className="min-h-[120px]"
              placeholder="Anote o resultado do contato..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
            <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={saveObservacoes}>
              {saved ? 'Salvo!' : <><Save className="h-3.5 w-3.5" /> Salvar observações</>}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir lead"
        description={`Excluir permanentemente "${lead.nome}"?`}
        confirmLabel={busyDelete ? 'Excluindo...' : 'Excluir'}
      />

      <MessageGeneratorModal
        open={messageModal}
        onClose={() => setMessageModal(false)}
        leadIds={lead.id}
        leadRef={{ telefone: lead.telefone, telefoneInternacional: lead.telefoneInternacional }}
      />
    </div>
  );
}
