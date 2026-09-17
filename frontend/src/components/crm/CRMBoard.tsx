import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Building2, Star } from 'lucide-react';
import type { CrmLeadFull, CrmStage } from '../../types';
import { CRM_STAGE_ORDER } from '../../lib/utils';
import { CRMColumn } from './CRMColumn';

function CardPreview({ crmLead }: { crmLead: CrmLeadFull }) {
  const lead = crmLead.lead;
  return (
    <div className="w-72 cursor-grabbing rounded-xl border border-indigo-400 bg-white p-3 shadow-xl dark:bg-slate-800">
      <h4 className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{lead.nome}</h4>
      <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
        <Building2 className="h-3 w-3" />
        {lead.categoria ?? lead.nicho ?? '—'}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {lead.quantidadeAvaliacoes ?? 0} avaliações
        </span>
        <span className="rounded-md bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          Score {lead.leadScore}
        </span>
      </div>
    </div>
  );
}

export function CRMBoard({
  groups,
  onMove,
  onOpenCard,
}: {
  groups: Record<CrmStage, CrmLeadFull[]>;
  onMove: (activeId: string, targetStage: CrmStage, overIndex: number) => void;
  onOpenCard: (id: string) => void;
}) {
  const [activeItem, setActiveItem] = useState<CrmLeadFull | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const cardIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const stage of CRM_STAGE_ORDER) {
      for (const item of groups[stage]) set.add(item.id);
    }
    return set;
  }, [groups]);

  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const pointer = pointerWithin(args);
      if (pointer.length > 0) {
        return [...pointer].sort((a, b) => {
          const aIsCard = cardIdSet.has(String(a.id)) ? 0 : 1;
          const bIsCard = cardIdSet.has(String(b.id)) ? 0 : 1;
          return aIsCard - bIsCard;
        });
      }
      return rectIntersection(args);
    },
    [cardIdSet],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    for (const stage of CRM_STAGE_ORDER) {
      const found = groups[stage].find((i) => i.id === id);
      if (found) {
        setActiveItem(found);
        return;
      }
    }
    setActiveItem(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    let activeStage: CrmStage | null = null;
    let activeIndex = -1;
    for (const stage of CRM_STAGE_ORDER) {
      const idx = groups[stage].findIndex((i) => i.id === activeId);
      if (idx >= 0) {
        activeStage = stage;
        activeIndex = idx;
        break;
      }
    }
    if (activeStage === null) return;

    let targetStage: CrmStage | null = null;
    let overIndex = -1;
    if (CRM_STAGE_ORDER.includes(overId as CrmStage)) {
      targetStage = overId as CrmStage;
      overIndex = groups[overId as CrmStage].length;
    } else {
      for (const stage of CRM_STAGE_ORDER) {
        const idx = groups[stage].findIndex((i) => i.id === overId);
        if (idx >= 0) {
          targetStage = stage;
          overIndex = idx;
          break;
        }
      }
    }
    if (targetStage === null) return;

    let finalIndex = overIndex;
    if (targetStage === activeStage && activeIndex < overIndex) {
      finalIndex = Math.max(overIndex - 1, 0);
    }

    onMove(activeId, targetStage, finalIndex);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveItem(null)}>
      <div className="flex h-full items-start gap-3 overflow-x-auto pb-4">
        {CRM_STAGE_ORDER.map((stage) => (
          <CRMColumn
            key={stage}
            stage={stage}
            items={groups[stage]}
            isOver={activeItem !== null}
            onOpenCard={onOpenCard}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeItem ? <CardPreview crmLead={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}