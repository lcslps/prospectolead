import { useDroppable } from '@dnd-kit/core';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const update = () => setHasMoreBelow(content.scrollHeight > content.clientHeight + 2 && content.scrollTop + content.clientHeight < content.scrollHeight - 2);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    return () => observer.disconnect();
  }, [items]);

  return (
    <div
      ref={setNodeRef}
      data-crm-stage={stage}
      className={`crm-pipeline-column relative flex flex-col border ${
        over ? 'border-brand-400 ring-2 ring-brand-500/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${CRM_DOT_COLORS[stage]}`} />
        <span className="text-xs font-semibold text-[var(--app-ink)]">
          {CRM_STAGE_HEADERS[stage]}
        </span>
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-[var(--app-muted)]" style={{ background: 'var(--app-raised)' }}>
          {items.length}
        </span>
      </div>

      <div ref={contentRef} onScroll={() => {
        const content = contentRef.current;
        if (content) setHasMoreBelow(content.scrollTop + content.clientHeight < content.scrollHeight - 2);
      }} className="crm-column-content flex-1 space-y-2 overflow-y-auto px-2 pb-3 pt-1">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <CRMCard key={item.id} crmLead={item} onOpen={() => onOpenCard(item.id)} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed text-[11px] text-[var(--app-muted)]" style={{ borderColor: 'var(--app-border)' }}>
            Arraste leads para cá
          </div>
        )}
      </div>
      {hasMoreBelow && <div className="crm-column-scroll-hint" aria-hidden="true"><ChevronDown size={14} />Role para ver mais</div>}
    </div>
  );
}
