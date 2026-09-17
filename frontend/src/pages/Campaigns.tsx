import { Button } from '../components/ui/Button';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getData, deleteData, postData } from '../services/api';
import type { Campaign, LeadStatus } from '../types';
import { EmptyState, PageLoader, SkeletonTable } from '../components/UI';
import { ConfirmDialog } from '../components/Modal';
import { ScoreBadge, StatusBadge } from '../components/Badges';
import { useToast } from '../components/Toast';
import { formatDate } from '../lib/utils';

interface CampaignDetail extends Campaign {
  leads: Array<{
    lead: {
      id: string;
      nome: string;
      categoria: string | null;
      cidade: string | null;
      estado: string | null;
      telefone: string | null;
      site: string | null;
      nota: number | null;
      quantidadeAvaliacoes: number | null;
      status: LeadStatus;
      leadScore: number;
      createdAt: string;
    };
  }>;
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
  const toast = useToast();

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

  const toggleDetail = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetailLoading(true);
    try {
      const data = await getData<CampaignDetail>(`/campaigns/${id}`);
      setDetail(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar campanha');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyDelete(true);
    try {
      await deleteData<null>(`/campaigns/${confirmDelete.id}`);
      toast.success('Campanha excluída');
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {campaigns.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10" />}
          title="Nenhuma campanha ainda"
          description="As prospecções realizadas aparecem aqui como campanhas."
          action={<Link to="/prospeccao" className="btn-primary">Prospectar leads</Link>}
        />
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} className="card overflow-hidden">
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
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                            <th className="table-th">Empresa</th>
                            <th className="table-th">Cidade</th>
                            <th className="table-th">Nota</th>
                            <th className="table-th">Score</th>
                            <th className="table-th">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.leads.map(({ lead }) => (
                            <tr
                              key={lead.id}
                              className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                            >
                              <td className="table-td">
                                <Link
                                  to={`/leads/${lead.id}`}
                                  className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                                >
                                  {lead.nome}
                                </Link>
                              </td>
                              <td className="table-td text-xs">
                                {lead.cidade ?? '—'} {lead.estado ? `/${lead.estado}` : ''}
                              </td>
                              <td className="table-td">{lead.nota ? `${lead.nota.toFixed(1).replace('.', ',')} ★` : '—'}</td>
                              <td className="table-td"><ScoreBadge score={lead.leadScore} /></td>
                              <td className="table-td"><StatusBadge status={lead.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
        onConfirm={handleDelete}
        title="Excluir campanha"
        description={`Excluir a campanha "${confirmDelete?.nome}"? Os leads vinculados não serão excluídos.`}
        confirmLabel={busyDelete ? 'Excluindo...' : 'Excluir'}
      />
    </div>
  );
}