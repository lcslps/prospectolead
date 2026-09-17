import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { getData, postData, patchData, deleteData } from '../services/api';
import type { CrmLeadFull, CrmStage, CrmStats } from '../types';
import { CRM_PIPELINE_STAGES as CRM_STAGE_ORDER, CRM_STAGE_LABELS, pipelineStage } from '../lib/utils';
import { useToast } from '../components/Toast';
import { CRMBoard } from '../components/crm/CRMBoard';
import { CRMStats } from '../components/crm/CRMStats';
import { CRMFilters, EMPTY_CRM_FILTERS, hasActiveCrmFilter, type CrmCourierFilters } from '../components/crm/CRMFilters';
import { CRMLeadDrawer } from '../components/crm/CRMLeadDrawer';

function emptyGroups(): Record<CrmStage, CrmLeadFull[]> {
  const groups = {} as Record<CrmStage, CrmLeadFull[]>;
  for (const stage of CRM_STAGE_ORDER) groups[stage] = [];
  return groups;
}

function computeStats(groups: Record<CrmStage, CrmLeadFull[]>): CrmStats {
  const count = (s: CrmStage) => groups[s]?.length ?? 0;
  const total =
    CRM_STAGE_ORDER.reduce((acc, s) => acc + count(s), 0);
  const mensagensEnviadas =
    count('MESSAGE_SENT') + count('REPLIED') + count('INTERESTED') + count('NEGOTIATION') + count('CLIENT');
  const responderam = count('REPLIED') + count('INTERESTED') + count('NEGOTIATION') + count('CLIENT');
  const clientes = count('CLIENT');
  return {
    leadsNoCrm: total,
    novas: count('NEW'),
    mensagensEnviadas,
    responderam,
    interessados: count('INTERESTED'),
    negociacao: count('NEGOTIATION'),
    clientes,
    perdidos: count('LOST'),
    taxaResposta: mensagensEnviadas > 0 ? Math.round((responderam / mensagensEnviadas) * 100) : 0,
    taxaConversao: total > 0 ? Math.round((clientes / total) * 100) : 0,
    porStage: Object.fromEntries(CRM_STAGE_ORDER.map((s) => [s, count(s)])),
  };
}

export function CRMPage() {
  const [groups, setGroups] = useState<Record<CrmStage, CrmLeadFull[]>>(emptyGroups());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CrmCourierFilters>(EMPTY_CRM_FILTERS);
  const [debounced, setDebounced] = useState<CrmCourierFilters>(EMPTY_CRM_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(filters), 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (debounced.search.trim()) params.search = debounced.search.trim();
      if (debounced.cidade.trim()) params.cidade = debounced.cidade.trim();
      if (debounced.nicho.trim()) params.nicho = debounced.nicho.trim();
      if (debounced.scoreMin) params.scoreMin = Number(debounced.scoreMin);
      if (debounced.comTelefone) params.comTelefone = true;
      if (debounced.comSite) params.comSite = true;
      if (debounced.semSite) params.semSite = true;
      if (debounced.followUpToday) params.followUpToday = true;
      if (debounced.followUpLate) params.followUpLate = true;

      const data = await getData<{ leads: CrmLeadFull[] }>('/crm', params);
      const next = emptyGroups();
      for (const lead of data.leads) {
        if (!next[lead.stage]) next[lead.stage] = [];
        next[lead.stage].push(lead);
      }
      setGroups(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar CRM');
    } finally {
      setLoading(false);
    }
  }, [debounced, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => computeStats(groups), [groups]);

  const applyDetail = (detail: CrmLeadFull) => {
    setGroups((prev) => {
      const next = { ...prev };
      for (const stage of CRM_STAGE_ORDER) {
        next[stage] = next[stage].filter((i) => i.id !== detail.id);
      }
      const target = [...(next[detail.stage] ?? [])];
      target.push(detail);
      next[detail.stage] = target.map((item, index) => ({ ...item, position: index * 10 }));
      return next;
    });
  };

  const persistColumn = (stage: CrmStage, items: CrmLeadFull[]) => {
    return Promise.all(
      items.map((item) => patchData(`/crm/leads/${item.id}/stage`, { stage, position: item.position })),
    );
  };

  const handleMove = (activeId: string, targetStage: CrmStage, overIndex: number) => {
    let sourceStage: CrmStage | null = null;
    let activeItem: CrmLeadFull | null = null;
    for (const stage of CRM_STAGE_ORDER) {
      const found = groups[stage].find((i) => i.id === activeId);
      if (found) {
        sourceStage = stage;
        activeItem = found;
        break;
      }
    }
    if (!sourceStage || !activeItem) return;

    if (sourceStage === targetStage) {
      const currentIndex = groups[sourceStage].findIndex((i) => i.id === activeId);
      if (currentIndex === overIndex) return;
    }

    const previous = groups;
    const next = { ...groups };
    next[sourceStage] = next[sourceStage].filter((i) => i.id !== activeId);

    const target = [...(next[targetStage] ?? [])];
    const idx = Math.min(Math.max(overIndex, 0), target.length);
    target.splice(idx, 0, { ...activeItem, stage: targetStage });

    const withPositions = target.map((item, index) => ({ ...item, position: index * 10 }));
    next[targetStage] = withPositions;
    setGroups(next);

    persistColumn(targetStage, withPositions)
      .then(() => toast.success('Lead movido'))
      .catch((e) => {
        toast.error(e instanceof Error ? `Erro ao mover: ${e.message}` : 'Erro ao mover lead');
        setGroups(previous);
      });
  };

  const fetchDetail = useCallback((id: string) => getData<CrmLeadFull>(`/crm/leads/${id}`), []);

  const handleStageChange = async (id: string, stage: CrmStage) => {
    const position = (groups[stage]?.length ?? 0) * 10;
    await patchData(`/crm/leads/${id}/stage`, { stage, position });
    const detail = await fetchDetail(id);
    applyDetail(detail);
    return detail;
  };

  const handleNoteAdd = async (id: string, desc: string) => {
    await postData(`/crm/leads/${id}/notes`, { description: desc });
    const detail = await fetchDetail(id);
    applyDetail(detail);
    return detail;
  };

  const handleFollowUpSet = async (id: string, value: string | null) => {
    await patchData(`/crm/leads/${id}/follow-up`, { nextFollowUpAt: value });
    const detail = await fetchDetail(id);
    applyDetail(detail);
    return detail;
  };

  const handleLastContactSet = async (id: string) => {
    await patchData(`/crm/leads/${id}`, { lastContactAt: new Date().toISOString() });
    const detail = await fetchDetail(id);
    applyDetail(detail);
    return detail;
  };

  const handleMessageSent = async (id: string) => {
    await postData(`/crm/leads/${id}/activities`, {
      type: 'MESSAGE_SENT',
      description: 'Mensagem enviada via WhatsApp',
    });
    return handleStageChange(id, 'MESSAGE_SENT');
  };

  const handleRemove = async (id: string) => {
    await deleteData(`/crm/leads/${id}`);
    setGroups((prev) => {
      const next = { ...prev };
      for (const stage of CRM_STAGE_ORDER) {
        next[stage] = next[stage].filter((i) => i.id !== id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Filter className="h-4 w-4 text-brand-500" />
          Apenas leads enviados manualmente para o CRM aparecem aqui.
        </div>
        {hasActiveCrmFilter(debounced) && (
          <span className="text-xs text-slate-400">Filtros aplicados</span>
        )}
      </div>

      <CRMStats stats={loading ? null : stats} />

      <CRMFilters filters={filters} onChange={setFilters} />

      <div className="h-[calc(100vh-18rem)] min-h-[480px] overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <CRMBoard groups={groups} onMove={handleMove} onOpenCard={setSelectedId} />
        )}
      </div>

      <CRMLeadDrawer
        open={selectedId !== null}
        crmLeadId={selectedId}
        onClose={() => setSelectedId(null)}
        onStageChange={handleStageChange}
        onNoteAdd={handleNoteAdd}
        onFollowUpSet={handleFollowUpSet}
        onLastContactSet={handleLastContactSet}
        onMessageSent={handleMessageSent}
        onRemove={handleRemove}
      />
    </div>
  );
}

export function CrmStageLabel({ stage }: { stage: CrmStage }) {
  return <span>{CRM_STAGE_LABELS[stage]}</span>;
}