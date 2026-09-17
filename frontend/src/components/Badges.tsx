import { Star } from 'lucide-react';
import { STATUS_LABELS, STATUS_STYLES, formatScore } from '../lib/utils';
import type { LeadStatus } from '../types';

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`badge border border-transparent ring-1 ${STATUS_STYLES[status] ?? STATUS_STYLES.NOVO}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const { label, badgeClass } = formatScore(score);
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-80">·</span>
      {label}
    </span>
  );
}

export function RatingBadge({ nota, avaliacoes }: { nota: number | null; avaliacoes: number | null }) {
  if (nota === null && avaliacoes === null) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {nota !== null && (
        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {nota.toFixed(1).replace('.', ',')}
        </span>
      )}
      {avaliacoes !== null && <span className="text-slate-400">({avaliacoes})</span>}
    </span>
  );
}