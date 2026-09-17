import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  MessageSquareText,
  RefreshCw,
  Trash2,
  Eye,
  Globe,
  Phone,
  FilterX,
  Loader2,
  CheckSquare,
  Send,
  Check,
} from 'lucide-react';
import { getData, postData, getCsv } from '../services/api';
import { LEAD_STATUSES, type Lead, type LeadStatus, type PagedLeads } from '../types';
import { STATUS_LABELS, CRM_STAGE_LABELS, CRM_STAGE_STYLES } from '../lib/utils';
import { EmptyState, Pagination, SkeletonTable } from '../components/UI';
import { RatingBadge, ScoreBadge, StatusBadge } from '../components/Badges';
import { ConfirmDialog } from '../components/Modal';
import { MessageGeneratorModal } from '../components/MessageGeneratorModal';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ToggleChip } from '../components/ui/ToggleChip';
import { whatsAppLink } from '../lib/utils';

interface Filters {
  search: string;
  cidade: string;
  estado: string;
  status: string;
  comTelefone: boolean;
  semTelefone: boolean;
  comSite: boolean;
  semSite: boolean;
  notaMinima: string;
  crm: string;
  orderBy: string;
  order: 'asc' | 'desc';
}

const INITIAL_FILTERS: Filters = {
  search: '',
  cidade: '',
  estado: '',
  status: '',
  comTelefone: false,
  semTelefone: false,
  comSite: false,
  semSite: false,
  notaMinima: '',
  crm: '',
  orderBy: 'createdAt',
  order: 'desc',
};

export function LeadsPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [debounced, setDebounced] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState<PagedLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; single?: Lead } | null>(null);
  const [confirmEnrich, setConfirmEnrich] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | ''>('');
  const [busyDelete, setBusyDelete] = useState(false);
  const [busyEnrich, setBusyEnrich] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [crmAddingIds, setCrmAddingIds] = useState<Set<string>>(new Set());
  const [busyCrmBulk, setBusyCrmBulk] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(filters);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const load = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page: pageToLoad,
          pageSize,
        };
        if (debounced.search.trim()) params.search = debounced.search.trim();
        if (debounced.cidade.trim()) params.cidade = debounced.cidade.trim();
        if (debounced.estado) params.estado = debounced.estado;
        if (debounced.status) params.status = debounced.status;
        if (debounced.comTelefone) params.comTelefone = true;
        if (debounced.semTelefone) params.semTelefone = true;
        if (debounced.comSite) params.comSite = true;
        if (debounced.semSite) params.semSite = true;
        if (debounced.notaMinima) params.notaMinima = Number(debounced.notaMinima);
        if (debounced.crm) params.crm = debounced.crm;
        if (debounced.orderBy !== 'createdAt') params.orderBy = debounced.orderBy;
        if (debounced.order !== 'desc') params.order = debounced.order;

        const result = await getData<PagedLeads>('/leads', params);
        setData(result);
        setSelected(new Set());
        setAllSelected(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao carregar leads');
      } finally {
        setLoading(false);
      }
    },
    [debounced, pageSize, toast],
  );

  useEffect(() => {
    load(page);
  }, [load, page]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debounced.search.trim()) n++;
    if (debounced.cidade.trim()) n++;
    if (debounced.estado) n++;
    if (debounced.status) n++;
    if (debounced.comTelefone) n++;
    if (debounced.semTelefone) n++;
    if (debounced.comSite) n++;
    if (debounced.semSite) n++;
    if (debounced.notaMinima) n++;
    if (debounced.crm) n++;
    if (debounced.orderBy !== 'createdAt') n++;
    return n;
  }, [debounced]);

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.items.length) {
      setSelected(new Set());
      setAllSelected(false);
    } else {
      setSelected(new Set(data.items.map((i) => i.id)));
      setAllSelected(true);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setAllSelected(data ? next.size === data.items.length : false);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyDelete(true);
    try {
      await postData<{ deleted: number }>('/leads/bulk/delete', { ids: confirmDelete.ids });
      toast.success('Leads excluídos');
      setConfirmDelete(null);
      load(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setBusyDelete(false);
    }
  };

  const handleEnrichSelected = async () => {
    setBusyEnrich(true);
    try {
      const ids = Array.from(selected);
      const result = await postData<{ updated: number; total: number }>('/leads/enrich-selected', { ids });
      toast.success(`${result.updated} de ${result.total} leads atualizados`);
      setConfirmEnrich(false);
      load(page);
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
      load(page);
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
      load(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status');
    } finally {
      setBusyStatus(false);
    }
  };

  const handleAddToCrm = async (lead: Lead) => {
    setCrmAddingIds((prev) => new Set(prev).add(lead.id));
    try {
      const result = await postData<{ created: boolean; alreadyInCrm: boolean }>('/crm/leads', {
        leadId: lead.id,
      });
      if (result.alreadyInCrm) toast.info('Lead já está no CRM');
      else toast.success(`${lead.nome} enviado para o CRM`);
      load(page);
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
      setSelected(new Set());
      load(page);
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
      } else {
        const params: Record<string, string | number | boolean | undefined> = {};
        if (debounced.search.trim()) params.search = debounced.search.trim();
        if (debounced.cidade.trim()) params.cidade = debounced.cidade.trim();
        if (debounced.estado) params.estado = debounced.estado;
        if (debounced.status) params.status = debounced.status;
        if (debounced.comTelefone) params.comTelefone = true;
        if (debounced.semTelefone) params.semTelefone = true;
        if (debounced.comSite) params.comSite = true;
        if (debounced.semSite) params.semSite = true;
        if (debounced.notaMinima) params.notaMinima = Number(debounced.notaMinima);
        if (debounced.crm) params.crm = debounced.crm;
        await getCsv('/leads/export/csv', params, 'leads.csv');
      }
      toast.success('Exportação iniciada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar');
    }
  };

  const leadRefForModal = useMemo(() => {
    if (selected.size > 0 && data) {
      const first = data.items.find((i) => selected.has(i.id));
      if (first)
        return { telefone: first.telefone, telefoneInternacional: first.telefoneInternacional };
    }
    return null;
  }, [selected, data]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          <div className="col-span-2">
            <Input
              placeholder="Buscar empresa, categoria ou endereço..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div>
            <Input
              placeholder="Cidade"
              value={filters.cidade}
              onChange={(e) => setFilters((f) => ({ ...f, cidade: e.target.value }))}
            />
          </div>
          <div>
            <Input
              placeholder="UF"
              maxLength={2}
              value={filters.estado}
              onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <Select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Status</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              placeholder="Nota mín."
              value={filters.notaMinima}
              onChange={(e) => setFilters((f) => ({ ...f, notaMinima: e.target.value }))}
            />
          </div>
          <div>
            <Select
              value={filters.crm}
              onChange={(e) => setFilters((f) => ({ ...f, crm: e.target.value }))}
            >
              <option value="">CRM: Todos</option>
              <option value="none">Fora do CRM</option>
              <option value="in">No CRM</option>
            </Select>
          </div>
          <div>
            <Select
              value={filters.orderBy}
              onChange={(e) => setFilters((f) => ({ ...f, orderBy: e.target.value }))}
            >
              <option value="createdAt">Mais recentes</option>
              <option value="nota">Maior nota</option>
              <option value="avaliacoes">Mais avaliações</option>
              <option value="score">Melhor score</option>
              <option value="nome">Nome A-Z</option>
              <option value="cidade">Cidade</option>
            </Select>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-1 md:col-span-2 lg:col-span-2">
            <ToggleChip
              active={filters.comTelefone}
              onClick={() => setFilters((f) => ({ ...f, comTelefone: !f.comTelefone, semTelefone: false }))}
            >
              <Phone className="h-3 w-3" /> Com tel.
            </ToggleChip>
            <ToggleChip
              active={filters.comSite}
              onClick={() => setFilters((f) => ({ ...f, comSite: !f.comSite, semSite: false }))}
            >
              <Globe className="h-3 w-3" /> Com site
            </ToggleChip>
            <ToggleChip
              active={filters.semSite}
              onClick={() => setFilters((f) => ({ ...f, semSite: !f.semSite, comSite: false }))}
            >
              <Globe className="h-3 w-3" /> Sem site
            </ToggleChip>
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0} title="Limpar filtros">
              <FilterX className="h-3.5 w-3.5" />
              Limpar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport} title="Exportar CSV">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-2 border-indigo-500/50 bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
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
          <Button variant="danger" size="xs" onClick={() => setConfirmDelete({ ids: Array.from(selected) })}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={8} cols={8} />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Search className="h-10 w-10" />}
                title="Nenhum lead encontrado"
                description="Ajuste os filtros ou comece uma nova prospecção."
                action={
                  <Link to="/prospeccao" className="btn-primary">
                    Prospectar leads
                  </Link>
                }
              />
            </div>
          ) : (
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="table-th w-8">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="table-th">Empresa</th>
                  <th className="table-th hidden lg:table-cell">Categoria</th>
                  <th className="table-th hidden md:table-cell">Cidade</th>
                  <th className="table-th hidden xl:table-cell">Telefone</th>
                  <th className="table-th hidden lg:table-cell">Site</th>
                  <th className="table-th">Nota</th>
                  <th className="table-th hidden lg:table-cell">Score</th>
                  <th className="table-th hidden sm:table-cell">CRM</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((lead) => {
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
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selected.has(lead.id)}
                          onChange={() => toggleOne(lead.id)}
                        />
                      </td>
                      <td className="table-td max-w-[220px]">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="line-clamp-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {lead.nome}
                        </Link>
                      </td>
                      <td className="table-td hidden text-xs lg:table-cell">{lead.categoria ?? '—'}</td>
                      <td className="table-td hidden text-xs md:table-cell">
                        {lead.cidade ?? '—'} {lead.estado ? `/${lead.estado}` : ''}
                      </td>
                      <td className="table-td hidden whitespace-nowrap text-xs xl:table-cell">{lead.telefone ?? '—'}</td>
                      <td className="table-td hidden lg:table-cell">
                        {lead.site ? (
                          <a
                            href={lead.site}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Site
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="table-td whitespace-nowrap">
                        <RatingBadge nota={lead.nota} avaliacoes={lead.quantidadeAvaliacoes} />
                      </td>
                      <td className="table-td hidden lg:table-cell">
                        <ScoreBadge score={lead.leadScore} />
                      </td>
                      <td className="table-td hidden whitespace-nowrap sm:table-cell">
                        {lead.crmStage ? (
                          <span className={`badge ring-1 ${CRM_STAGE_STYLES[lead.crmStage]}`}>
                            {CRM_STAGE_LABELS[lead.crmStage]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={lead.status} />
                      </td>
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
                          <button
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Gerar mensagem"
                            onClick={() => {
                              setSelected(new Set([lead.id]));
                              setMessageModal(true);
                            }}
                          >
                            <MessageSquareText className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            title="Enriquecer líder"
                            disabled={isEnriching}
                            onClick={() => handleEnrichOne(lead.id)}
                          >
                            {isEnriching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Excluir"
                            onClick={() => setConfirmDelete({ ids: [lead.id], single: lead })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {inCrm ? (
                            <span
                              className="rounded-lg p-1.5 text-emerald-600 dark:text-emerald-400"
                              title="No CRM — clique para abrir"
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 disabled:opacity-40"
                              title={isAddingCrm ? 'Enviando...' : 'Enviar para o CRM'}
                              disabled={isAddingCrm}
                              onClick={() => handleAddToCrm(lead)}
                            >
                              {isAddingCrm ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {data && data.items.length > 0 && !loading && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {data ? `${data.total} lead(s) no total${debounced.orderBy !== 'createdAt' ? ' (ordenados)' : ''}` : ''}
      </p>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir leads"
        description={
          confirmDelete?.single
            ? `Excluir permanentemente "${confirmDelete.single.nome}"?`
            : `Excluir permanentemente ${confirmDelete?.ids.length ?? 0} leads selecionados?`
        }
        confirmLabel={busyDelete ? 'Excluindo...' : 'Excluir'}
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