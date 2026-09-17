import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Star, CalendarClock, Phone, GripVertical, Flame } from 'lucide-react';
import type { CrmLeadFull } from '../../types';
import { formatRating, followUpStatus, whatsAppLink } from '../../lib/utils';

export function CRMCard({
  crmLead,
  onOpen,
}: {
  crmLead: CrmLeadFull;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: crmLead.id,
    data: { crmLead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lead = crmLead.lead;
  const wa = whatsAppLink(lead.telefone, lead.telefoneInternacional);
  const fu = followUpStatus(crmLead.nextFollowUpAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`group cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md dark:bg-slate-800/80 ${
        isDragging
          ? 'z-10 border-brand-500 opacity-60'
          : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/50'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{lead.nome}</h4>
          <p className="flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
            <Building2 className="h-3 w-3 shrink-0" />
            {lead.categoria ?? lead.nicho ?? '—'}
            {lead.cidade ? ` · ${lead.cidade}${lead.estado ? `/${lead.estado}` : ''}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              title="Abrir WhatsApp"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          <GripVertical className="h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600" />
        </div>
      </div>

      <div className="mb-2 text-[11px] text-slate-500">
        <p>{lead.telefone || lead.telefoneInternacional || 'Sem telefone'}</p>
        <p>{lead.site ? 'Possui site' : 'Sem site'} · {crmLead.website?.generationStatus === 'completed' ? 'Site gerado ✓' : crmLead.website?.generationStatus === 'generating' ? 'Gerando site...' : 'Site ainda não gerado'}</p>
      </div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        {lead.quantidadeAvaliacoes !== null && lead.quantidadeAvaliacoes > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {formatRating(lead.nota)} · {lead.quantidadeAvaliacoes}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
            lead.leadScore >= 70
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : lead.leadScore >= 50
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Flame className={`h-3 w-3 ${lead.leadScore >= 70 ? 'text-amber-500' : ''}`} />
          Score {lead.leadScore}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="min-w-0 truncate">
          {crmLead.lastContactAt && <span>Últ. contato: {shortDate(crmLead.lastContactAt)}</span>}
        </div>
        {crmLead.nextFollowUpAt && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${
              fu.late
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : fu.today
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            <CalendarClock className="h-3 w-3" />
            {fu.late ? 'Atrasado' : fu.today ? 'Hoje' : 'Follow-up'}
          </span>
        )}
      </div>
    </div>
  );
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
