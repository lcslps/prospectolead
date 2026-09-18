import { Button } from '../components/ui/Button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Phone,
  MessageSquareText,
  RefreshCw,
  Send,
  Check,
  CheckSquare,
  Loader2,
  Download,
} from 'lucide-react';
import { getData, deleteData, postData, getCsv } from '../services/api';
import { LEAD_STATUSES, type Campaign, type LeadStatus, type CrmStage } from '../types';
import { STATUS_LABELS, CRM_STAGE_LABELS, CRM_STAGE_STYLES, whatsAppLink, formatDate } from '../lib/utils';
import { EmptyState, PageLoader, SkeletonTable, SortableTh, type SortDir } from '../components/UI';
import { ConfirmDialog } from '../components/Modal';
import { RatingBadge, ScoreBadge, StatusBadge } from '../components/Badges';
import { MessageGeneratorModal } from '../components/MessageGeneratorModal';
import { useToast } from '../components/Toast';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface CampaignLead {
  id: string;
  googlePlaceId: string;
  nome: string;
  categoria: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  telefoneInternacional: string | null;
  site: string | null;
  nota: number | null;
  quantidadeAvaliacoes: number | null;
  status: LeadStatus;
  leadScore: number;
  createdAt: string;
  crmStage?: CrmStage | null;
  crmLeadId?: string | null;
}

interface CampaignDetail extends Campaign {
  leads: Array<{ lead: CampaignLead }>;
}

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [reprospectando, setReprospectando] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | ''>('');
  const [busyStatus, setBusyStatus] = useState(false);
  const [busyCrmBulk, setBusyCrmBulk] = useState(false);
  const [busyEnrich, setBusyEnrich] = useState(false);
  const [busyDeleteLead, setBusyDeleteLead] = useState(false);
  const [crmAddingIds, setCrmAddingIds] = useState<Set<string>>(new Set());
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [messageModal, setMessageModal] = useState(false);
  const [confirmEnrich, setConfirmEnrich] = useState(false);
  const [confirmDeleteLead, setConfirmDeleteLead] = useState<{ ids: string[]; nome?: string } | null>(null);
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toast = useToast();

  const handleSort = useCallback((field: string, dir: SortDir) => {
    setSortBy(field);
    setSortDir(dir);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getData<Campaign[]>('/campaigns');
      setCampaigns(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const clearSelection = () => {
    setSelected(new Set());
    setAllSelected(false);
    setBulkStatus('');
  };

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      try {
        const data = await getData<CampaignDetail>(`/campaigns/${id}`);
        setDetail(data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao carregar campanha');
      } finally {
        setDetailLoading(false);
      }
    },
    [toast],
  );

  const toggleDetail = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      clearSelection();
      return;
    }
    setOpenId(id);
    setDetail(null);
    setSortBy('');
    setSortDir('asc');
    clearSelection();
    await loadDetail(id);
  };

  const openLeadIds = useMemo(
    () => (detail && detail.id === openId ? detail.leads.map(({ lead }) => lead.id) : []),
    [detail, openId],
  );

  const sortedLeads = useMemo(() => {
    if (!detail || detail.id !== openId || !sortBy) return detail?.leads ?? [];
    const dir = sortDir === 'asc' ? 1 : -1;
    const value = (lead: CampaignLead): string | number | null => {
      switch (sortBy) {
        case 'nome':
          return lead.nome.toLocaleLowerCase('pt-BR');
        case 'cidade':
          return (lead.cidade ?? '').toLocaleLowerCase('pt-BR');
        case 'telefone':
          return lead.telefone ?? '';
        case 'nota':
          return lead.nota;
        case 'score':
          return lead.leadScore;
        case 'status':
          return lead.status;
        case 'crm':
          return lead.crmStage ?? '';
        default:
          return null;
      }
    };
    return [...detail.leads].sort((a, b) => {
      const va = value(a.lead);
      const vb = value(b.lead);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'pt-BR') * dir;
    });
  }, [detail, openId, sortBy, sortDir]);

  const toggleAll = () => {
    if (openLeadIds.length === 0) return;
    if (selected.size === openLeadIds.length) clearSelection();
    else {
      setSelected(new Set(openLeadIds));
      setAllSelected(true);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setAllSelected(openLeadIds.length > 0 && next.size === openLeadIds.length);
      return next;
    });
  };

  const refreshDetail = async () => {
    if (!openId) return;
    await loadDetail(openId);
  };

  const handleDeleteCampaign = async () => {
    if (!confirmDelete) return;
    setBusyDelete(true);
    try {
      await deleteData<null>(`/campaigns/${confirmDelete.id}`);
      toast.success('Campanha excluída');
      if (openId === confirmDelete.id) {
        setOpenId(null);
        setDetail(null);
        clearSelection();
      }
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir campanha');
    } finally {
      setBusyDelete(false);
    }
  };

  const reprospect = async (campaign: Campaign) => {
    setReprospectando(campaign.id);
    try {
      const result = await postData<{ novos: number; existentes: number; salvos: number }>('/prospeccao', {
        nicho: campaign.nicho,
        cidade: campaign.cidade,
        estado: campaign.estado,
        quantidade: campaign.quantidadeSolicitada,
        filters: { evitarExistentes: false },
      });
      toast.success(
        `Prospecção repetida: ${result.novos} novo(s), ${result.existentes} já existiam`,
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao reprospectar');
    } finally {
      setReprospectando(null);
    }
  };

  const handleDeleteLeads = async () => {
    if (!confirmDeleteLead) return;
    setBusyDeleteLead(true);
    try {
      await postData<{ deleted: number }>('/leads/bulk/delete', { ids: confirmDeleteLead.ids });
      toast.success('Leads excluídos');
      setConfirmDeleteLead(null);
      await refreshDetail();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setBusyDeleteLead(false);
    }
  };

  const handleEnrichSelected = async () => {
    setBusyEnrich(true);
    try {
      const ids = Array.from(selected);
      const result = await postData<{ updated: number; total: number }>('/leads/enrich-selected', { ids });
      toast.success(`${result.updated} de ${result.total} leads atualizados`);
      setConfirmEnrich(false);
      await refreshDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enriquecer');
    } finally {
      setBusyEnrich(false);
    }
  };

  const handleEnrichOne = async (id: string) => {
    setEnrichingIds((prev) => new Set(prev).add(id));
    try {
      const result = await postData<{ ok: boolean; updatedFields: string[]; message?: string }>(
        `/leads/${id}/enrich`,
        {},
      );
      if (result.ok) toast.success(`Lead atualizado com ${result.updatedFields.length} campo(s) novos`);
      else toast.info(result.message ?? 'Nenhum dado novo');
      await refreshDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enriquecer');
    } finally {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    setBusyStatus(true);
    try {
      const ids = Array.from(selected);
      await postData<{ updated: number }>('/leads/bulk/status', { ids, status: bulkStatus });
      toast.success('Status atualizado');
      setBulkStatus('');
      await refreshDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status');
    } finally {
      setBusyStatus(false);
    }
  };

  const handleAddToCrm = async (lead: CampaignLead) => {
    setCrmAddingIds((prev) => new Set(prev).add(lead.id));
    try {
      const result = await postData<{ created: boolean; alreadyInCrm: boolean }>('/crm/leads', {
        leadId: lead.id,
      });
      if (result.alreadyInCrm) toast.info('Lead já está no CRM');
      else toast.success(`${lead.nome} enviado para o CRM`);
      await refreshDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar para o CRM');
    } finally {
      setCrmAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const handleAddToCrmSelected = async () => {
    setBusyCrmBulk(true);
    try {
      const ids = Array.from(selected);
      const result = await postData<{ total: number; added: number; skipped: number }>('/crm/leads/bulk', {
        ids,
      });
      toast.success(
        result.added > 0
          ? `${result.added} lead(s) enviados para o CRM${result.skipped ? ` (${result.skipped} já estavam)` : ''}`
          : `Todos os ${result.skipped} já estavam no CRM`,
      );
      clearSelection();
      await refreshDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar para o CRM');
    } finally {
      setBusyCrmBulk(false);
    }
  };

  const handleExport = async () => {
    try {
      if (selected.size > 0) {
        await getCsv('/leads/export/csv', { ids: Array.from(selected).join(',') }, 'leads_selecionados.csv');
      } else if (openId) {
        await getCsv('/leads/export/csv', { campaignId: openId }, `campanha_${openId}.csv`);
      }
      toast.success('Exportação iniciada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar');
    }
  };

  const leadRefForModal = useMemo(() => {
    if (selected.size > 0 && detail) {
      const first = detail.leads.find(({ lead }) => selected.has(lead.id));
      if (first) return { telefone: first.lead.telefone, telefoneInternacional: first.lead.telefoneInternacional };
    }
    return null;
  }, [selected, detail]);

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="workspace-heading">
        <div>
          <p className="workspace-eyebrow">Comercial / Campanhas</p>
          <h2>Campanhas</h2>
          <p>Cada prospecção realizada vira uma campanha. Acompanhe os resultados, revise os leads e repita a pesquisa quando quiser.</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10" />}
          title="Nenhuma campanha ainda"
          description="As prospecções realizadas aparecem aqui como campanhas."
          action={<Link to="/prospeccao" className="btn-primary">Prospectar leads</Link>}
        />
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} className="panel-flush">
            <div
              className="flex cursor-pointer flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center"
              onClick={() => toggleDetail(campaign.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{campaign.nome}</div>
                  <div className="text-xs text-slate-500">
                    {campaign.nicho} · {campaign.cidade}/{campaign.estado} · {formatDate(campaign.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    {campaign._count?.leads ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-400">leads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {campaign.quantidadeEncontrada}
                  </div>
                  <div className="text-[11px] text-slate-400">encontrados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-500">{campaign.quantidadeSolicitada}</div>
                  <div className="text-[11px] text-slate-400">solicitados</div>
                </div>
                <Button variant="unstyled"
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    reprospect(campaign);
                  }}
                  disabled={reprospectando === campaign.id}
                  title="Repetir prospecção"
                >
                  {reprospectando === campaign.id ? 'Prospectando...' : 'Reprospeçar'}
                </Button>
                <Button variant="unstyled"
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(campaign);
                  }}
                  title="Excluir campanha"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {openId === campaign.id ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>

            {openId === campaign.id && (
              <div className="border-t border-slate-200 dark:border-slate-800">
                {detailLoading ? (
                  <div className="p-6">
                    <SkeletonTable rows={4} cols={5} />
                  </div>
                ) : detail && detail.id === campaign.id ? (
                  detail.leads.length === 0 ? (
                    <div className="p-6 text-sm text-slate-400">Nenhum lead vinculado.</div>
                  ) : (
                    <>
                      {selected.size > 0 && (
                        <div className="m-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-500/50 bg-brand-50/50 p-3 dark:bg-brand-950/20">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                            <CheckSquare className="h-4 w-4" />
                            {selected.size} selecionados
                          </span>
                          <div className="flex-1" />
                          <Select
                            className="!w-auto"
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value as LeadStatus | '')}
                          >
                            <option value="">Alterar status...</option>
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </Select>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={handleBulkStatus}
                            disabled={!bulkStatus || busyStatus}
                          >
                            {busyStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Aplicar
                          </Button>
                          <Button variant="secondary" size="xs" onClick={handleExport}>
                            <Download className="h-3.5 w-3.5" /> Exportar
                          </Button>
                          <Button variant="secondary" size="xs" onClick={() => setMessageModal(true)}>
                            <MessageSquareText className="h-3.5 w-3.5" /> Mensagens
                          </Button>
                          <Button variant="secondary" size="xs" onClick={() => setConfirmEnrich(true)}>
                            <RefreshCw className="h-3.5 w-3.5" /> Enriquecer
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={handleAddToCrmSelected}
                            disabled={busyCrmBulk}
                            title="Enviar selecionados para o CRM"
                          >
                            {busyCrmBulk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Enviar p/ CRM
                          </Button>
                          <Button variant="danger" size="xs" onClick={() => setConfirmDeleteLead({ ids: Array.from(selected) })}>
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </Button>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                              <th className="table-th w-8">
                                <Input unstyled
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                  checked={allSelected}
                                  onChange={toggleAll}
                                />
                              </th>
                              <SortableTh label="Empresa" field="nome" active={sortBy} dir={sortDir} onSort={handleSort} />
                              <SortableTh label="Cidade" field="cidade" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                              <SortableTh label="Telefone" field="telefone" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden xl:table-cell" />
                              <SortableTh label="Nota" field="nota" active={sortBy} dir={sortDir} onSort={handleSort} />
                              <SortableTh label="Score" field="score" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                              <SortableTh label="CRM" field="crm" active={sortBy} dir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                              <SortableTh label="Status" field="status" active={sortBy} dir={sortDir} onSort={handleSort} />
                              <th className="table-th text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedLeads.map(({ lead }) => {
                              const wa = whatsAppLink(lead.telefone, lead.telefoneInternacional);
                              const isEnriching = enrichingIds.has(lead.id);
                              const isAddingCrm = crmAddingIds.has(lead.id);
                              const inCrm = Boolean(lead.crmStage);
                              return (
                                <tr
                                  key={lead.id}
                                  className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                                >
                                  <td className="table-td">
                                    <Input unstyled
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                      checked={selected.has(lead.id)}
                                      onChange={() => toggleOne(lead.id)}
                                    />
                                  </td>
                                  <td className="table-td max-w-[240px]">
                                    <Link
                                      to={`/leads/${lead.id}`}
                                      className="line-clamp-2 font-medium text-brand-600 hover:underline dark:text-brand-400"
                                    >
                                      {lead.nome}
                                    </Link>
                                  </td>
                                  <td className="table-td hidden text-xs lg:table-cell">
                                    {lead.cidade ?? '—'} {lead.estado ? `/${lead.estado}` : ''}
                                  </td>
                                  <td className="table-td hidden whitespace-nowrap text-xs xl:table-cell">{lead.telefone ?? '—'}</td>
                                  <td className="table-td whitespace-nowrap">
                                    <RatingBadge nota={lead.nota} avaliacoes={lead.quantidadeAvaliacoes} />
                                  </td>
                                  <td className="table-td hidden lg:table-cell"><ScoreBadge score={lead.leadScore} /></td>
                                  <td className="table-td hidden whitespace-nowrap sm:table-cell">
                                    {lead.crmStage ? (
                                      <span
                                        className={`badge ring-1 ${CRM_STAGE_STYLES[lead.crmStage]}`}
                                        title={`No CRM · ${CRM_STAGE_LABELS[lead.crmStage]}`}
                                      >
                                        <Check className="h-3 w-3" />
                                        No CRM · {CRM_STAGE_LABELS[lead.crmStage]}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400">Fora do CRM</span>
                                    )}
                                  </td>
                                  <td className="table-td"><StatusBadge status={lead.status} /></td>
                                  <td className="table-td">
                                    <div className="flex items-center justify-end gap-1">
                                      <Link
                                        to={`/leads/${lead.id}`}
                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        title="Detalhes"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                      {wa && (
                                        <a
                                          href={wa}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                          title="Abrir WhatsApp"
                                        >
                                          <Phone className="h-4 w-4" />
                                        </a>
                                      )}
                                      <Button variant="unstyled"
                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        title="Gerar mensagem"
                                        onClick={() => {
                                          setSelected(new Set([lead.id]));
                                          setMessageModal(true);
                                        }}
                                      >
                                        <MessageSquareText className="h-4 w-4" />
                                      </Button>
                                      <Button variant="unstyled"
                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                        title="Enriquecer lider"
                                        disabled={isEnriching}
                                        onClick={() => handleEnrichOne(lead.id)}
                                      >
                                        {isEnriching ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <RefreshCw className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button variant="unstyled"
                                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                        title="Excluir"
                                        onClick={() => setConfirmDeleteLead({ ids: [lead.id], nome: lead.nome })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      {inCrm ? (
                                        <span
                                          className="rounded-lg p-1.5 text-emerald-600 dark:text-emerald-400"
                                          title={lead.crmStage ? `No CRM · ${CRM_STAGE_LABELS[lead.crmStage]}` : 'No CRM'}
                                        >
                                          <Check className="h-4 w-4" />
                                        </span>
                                      ) : (
                                        <Button variant="unstyled"
                                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 disabled:opacity-40"
                                          title={isAddingCrm ? 'Enviando...' : 'Enviar para o CRM'}
                                          disabled={isAddingCrm}
                                          onClick={() => handleAddToCrm(lead)}
                                        >
                                          {isAddingCrm ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Send className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                ) : null}
              </div>
            )}
          </div>
        ))
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteCampaign}
        title="Excluir campanha"
        description={`Excluir a campanha "${confirmDelete?.nome}"? Os leads vinculados não serão excluídos.`}
        confirmLabel={busyDelete ? 'Excluindo...' : 'Excluir'}
      />

      <ConfirmDialog
        open={confirmDeleteLead !== null}
        onClose={() => setConfirmDeleteLead(null)}
        onConfirm={handleDeleteLeads}
        title="Excluir leads"
        description={
          confirmDeleteLead?.nome
            ? `Excluir permanentemente "${confirmDeleteLead.nome}"?`
            : `Excluir permanentemente ${confirmDeleteLead?.ids.length ?? 0} leads selecionados?`
        }
        confirmLabel={busyDeleteLead ? 'Excluindo...' : 'Excluir'}
      />

      <ConfirmDialog
        open={confirmEnrich}
        onClose={() => setConfirmEnrich(false)}
        onConfirm={handleEnrichSelected}
        title="Enriquecer selecionados"
        description={`Essa ação fará ${selected.size} consulta(s) adicionais à Google Places API para buscar informações faltantes. Deseja continuar?`}
        confirmLabel={busyEnrich ? 'Enriquecendo...' : 'Enriquecer'}
        danger={false}
      />

      <MessageGeneratorModal
        open={messageModal}
        onClose={() => setMessageModal(false)}
        leadIds={Array.from(selected)}
        leadRef={leadRefForModal}
      />
    </div>
  );
}
