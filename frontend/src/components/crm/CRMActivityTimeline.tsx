import { PackagePlus, MessageSquareText, ArrowRight, StickyNote, CalendarClock, ExternalLink, Trophy, X, History } from 'lucide-react';
import type { CrmActivity, CrmActivityType } from '../../types';
import { formatCrmDate } from '../../lib/utils';

const ICONS: Record<CrmActivityType, React.ReactNode> = {
  ADDED_TO_CRM: <PackagePlus className="h-3.5 w-3.5" />,
  MESSAGE_SENT: <MessageSquareText className="h-3.5 w-3.5" />,
  STAGE_CHANGED: <ArrowRight className="h-3.5 w-3.5" />,
  NOTE_ADDED: <StickyNote className="h-3.5 w-3.5" />,
  FOLLOW_UP_CREATED: <CalendarClock className="h-3.5 w-3.5" />,
  WHATSAPP_OPENED: <ExternalLink className="h-3.5 w-3.5" />,
  CLIENT_WON: <Trophy className="h-3.5 w-3.5" />,
  LOST: <X className="h-3.5 w-3.5" />,
};

const COLORS: Record<CrmActivityType, string> = {
  ADDED_TO_CRM: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  MESSAGE_SENT: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  STAGE_CHANGED: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  NOTE_ADDED: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
  FOLLOW_UP_CREATED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  WHATSAPP_OPENED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CLIENT_WON: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  LOST: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function CRMActivityTimeline({ activities }: { activities?: CrmActivity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-400 dark:border-slate-700">
        <History className="h-4 w-4" />
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
      {activities.map((activity) => (
        <li key={activity.id} className="relative pl-7">
          <span className={`absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${COLORS[activity.type]}`}>
            {ICONS[activity.type]}
          </span>
          <p className="text-[11px] font-medium text-slate-400">{formatCrmDate(activity.createdAt)}</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{activity.description}</p>
        </li>
      ))}
    </ol>
  );
}