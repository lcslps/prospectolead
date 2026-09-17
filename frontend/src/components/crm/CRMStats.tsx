import { Users, MessageSquareText, Reply, HeartHandshake, Handshake, Trophy, TrendingUp } from 'lucide-react';
import type { CrmStats } from '../../types';

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight text-slate-900 dark:text-white">{value}</div>
        <div className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {sub && <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export function CRMStats({ stats }: { stats: CrmStats | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Leads no CRM"
        value={stats?.leadsNoCrm ?? 0}
        accent="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      />
      <StatCard
        icon={<MessageSquareText className="h-5 w-5" />}
        label="Mensagens enviadas"
        value={stats?.mensagensEnviadas ?? 0}
        accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      />
      <StatCard
        icon={<Reply className="h-5 w-5" />}
        label="Responderam"
        value={stats?.responderam ?? 0}
        sub={`${stats?.taxaResposta ?? 0}% de resposta`}
        accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
      <StatCard
        icon={<HeartHandshake className="h-5 w-5" />}
        label="Interessados"
        value={stats?.interessados ?? 0}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-500"
      />
      <StatCard
        icon={<Handshake className="h-5 w-5" />}
        label="Negociação"
        value={stats?.negociacao ?? 0}
        accent="bg-orange-500/10 text-orange-600 dark:text-orange-500"
      />
      <StatCard
        icon={<Trophy className="h-5 w-5" />}
        label="Clientes"
        value={stats?.clientes ?? 0}
        sub={`${stats?.taxaConversao ?? 0}% de conversão`}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Perdidos"
        value={stats?.perdidos ?? 0}
        accent="bg-red-500/10 text-red-600 dark:text-red-400"
      />
    </div>
  );
}