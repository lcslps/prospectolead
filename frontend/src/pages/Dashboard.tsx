import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Star,
  Users,
  Target,
  MessageCircle,
  Handshake,
  Crown,
  Globe,
  FolderOpen,
  Flame,
  XCircle,
} from 'lucide-react';
import { getData } from '../services/api';
import type { CrmStage, DashboardData } from '../types';
import { CRM_STAGE_LABELS, CRM_STAGE_ORDER, CRM_STAGE_STYLES } from '../lib/utils';
import { PageLoader, EmptyState } from '../components/UI';
import { ScoreBadge } from '../components/Badges';
import { useToast } from '../components/Toast';

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function BarList<T extends { label: string; value: number }>({ items, empty }: { items: T[]; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
        <Target className="h-8 w-8" />
        <span className="text-sm">{empty}</span>
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={idx}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            <span className="font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    getData<DashboardData>('/dashboard')
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: Error) => {
        toast.error(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  if (loading) return <PageLoader />;
  if (!data) return <EmptyState title="Não foi possível carregar o dashboard" />;

  const s = data.stats;
  const crm = data.crmStats;
  const stageCount = (stage: CrmStage) => crm?.porStage?.[stage] ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total de leads" value={crm?.leadsNoCrm ?? 0} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Leads novos" value={stageCount('NEW')} color="bg-sky-500/10 text-sky-600 dark:text-sky-400" icon={<Flame className="h-5 w-5" />} />
        <StatCard label="Contatados" value={stageCount('MESSAGE_SENT')} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" icon={<Phone className="h-5 w-5" />} />
        <StatCard label="Responderam" value={stageCount('REPLIED')} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" icon={<MessageCircle className="h-5 w-5" />} />
        <StatCard label="Interessados" value={stageCount('INTERESTED')} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" icon={<Star className="h-5 w-5" />} />
        <StatCard label="Negociação" value={stageCount('NEGOTIATION')} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Clientes" value={stageCount('CLIENT')} color="bg-green-600/10 text-green-700 dark:text-green-400" icon={<Crown className="h-5 w-5" />} />
        <StatCard label="Perdidos" value={stageCount('LOST')} color="bg-red-500/10 text-red-600 dark:text-red-400" icon={<XCircle className="h-5 w-5" />} />
        <StatCard label="Campanhas realizadas" value={s.campanhas} color="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400" icon={<FolderOpen className="h-5 w-5" />} />
        <StatCard label="Sites gerados" value={s.sitesGerados} color="bg-rose-500/10 text-rose-600 dark:text-rose-400" icon={<Globe className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1">
          <h2 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">CRM — leads por etapa</h2>
          <BarList
            empty="Nenhum lead no CRM ainda"
            items={CRM_STAGE_ORDER.map((stage) => ({
              label: CRM_STAGE_LABELS[stage],
              value: stageCount(stage),
            })).filter((item) => item.value > 0)}
          />
        </section>

        <section className="card p-5 lg:col-span-1">
          <h2 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">Top cidades</h2>
          <BarList
            empty="Sem leads com cidade ainda"
            items={data.porCidade.map((item) => ({ label: item.cidade, value: item._count._all }))}
          />
        </section>

        <section className="card p-5 lg:col-span-1">
          <h2 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">Top nichos</h2>
          <BarList
            empty="Sem nichos registrados ainda"
            items={data.topNichos.map((item) => ({ label: item.nicho, value: item._count._all }))}
          />
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Últimos leads</h2>
          <Link to="/crm" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Ver todos
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          {data.ultimosLeads.length === 0 ? (
            <div className="px-5 pb-6">
              <EmptyState
                icon={<Users className="h-10 w-10" />}
                title="Nenhum lead ainda"
                description="Comece uma prospecção para encontrar empresas na sua região."
                action={
                  <Link to="/prospeccao" className="btn-primary">
                    Prospectar leads
                  </Link>
                }
              />
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="table-th">Empresa</th>
                  <th className="table-th">Cidade</th>
                  <th className="table-th">Nota</th>
                  <th className="table-th">Score</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimosLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="table-td">
                      <Link to={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        {lead.nome}
                      </Link>
                    </td>
                    <td className="table-td">{lead.cidade ?? '—'}</td>
                    <td className="table-td">{lead.nota ? `${lead.nota.toFixed(1).replace('.', ',')} ★` : '—'}</td>
                    <td className="table-td"><ScoreBadge score={lead.leadScore} /></td>
                    <td className="table-td"><span className={`badge ring-1 ${CRM_STAGE_STYLES[lead.crmStage]}`}>{CRM_STAGE_LABELS[lead.crmStage]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
