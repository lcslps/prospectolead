import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CrmLeadFull, CrmStage } from '../../types';
import { CRM_DOT_COLORS, CRM_STAGE_HEADERS } from '../../lib/utils';
import { CRMCard } from './CRMCard';

export function CRMColumn({
  stage,
  items,
  isOver,
  onOpenCard,
}: {
  stage: CrmStage;
  items: CrmLeadFull[];
  isOver: boolean;
  onOpenCard: (id: string) => void;
}) {
  const { setNodeRef, isOver: dropOver } = useDroppable({ id: stage });
  const over = isOver || dropOver;

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-full w-72 shrink-0 flex-col rounded-2xl border bg-slate-100/60 dark:bg-slate-900/60 ${
        over ? 'border-brand-400 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${CRM_DOT_COLORS[stage]}`} />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {CRM_STAGE_HEADERS[stage]}
        </span>
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {items.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3 pt-1">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <CRMCard key={item.id} crmLead={item} onOpen={() => onOpenCard(item.id)} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-400 dark:border-slate-700">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  );
}