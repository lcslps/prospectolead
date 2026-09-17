import { FilterX, Phone, Globe } from 'lucide-react';
import { Input } from '../ui/Input';
import { ToggleChip } from '../ui/ToggleChip';
import { Button } from '../ui/Button';

export interface CrmCourierFilters {
  search: string;
  cidade: string;
  nicho: string;
  scoreMin: string;
  comTelefone: boolean;
  comSite: boolean;
  semSite: boolean;
  followUpToday: boolean;
  followUpLate: boolean;
}

export const EMPTY_CRM_FILTERS: CrmCourierFilters = {
  search: '',
  cidade: '',
  nicho: '',
  scoreMin: '',
  comTelefone: false,
  comSite: false,
  semSite: false,
  followUpToday: false,
  followUpLate: false,
};

export function hasActiveCrmFilter(f: CrmCourierFilters): boolean {
  return Boolean(
    f.search.trim() ||
      f.cidade.trim() ||
      f.nicho.trim() ||
      f.scoreMin.trim() ||
      f.comTelefone ||
      f.comSite ||
      f.semSite ||
      f.followUpToday ||
      f.followUpLate,
  );
}

export function CRMFilters({
  filters,
  onChange,
}: {
  filters: CrmCourierFilters;
  onChange: (f: CrmCourierFilters) => void;
}) {
  const set = <K extends keyof CrmCourierFilters>(key: K, value: CrmCourierFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="panel !p-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2">
          <Input
            placeholder="Buscar empresa..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Cidade"
            value={filters.cidade}
            onChange={(e) => set('cidade', e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Nicho"
            value={filters.nicho}
            onChange={(e) => set('nicho', e.target.value)}
          />
        </div>
        <div>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Score mín."
            value={filters.scoreMin}
            onChange={(e) => set('scoreMin', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 lg:col-span-1">
          <ToggleChip active={filters.comTelefone} onClick={() => set('comTelefone', !filters.comTelefone)}>
            <Phone className="h-3 w-3" /> Tel
          </ToggleChip>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-1.5">
          <ToggleChip active={filters.comSite} onClick={() => set('comSite', !filters.comSite)}>
            <Globe className="h-3 w-3" /> Com site
          </ToggleChip>
          <ToggleChip active={filters.semSite} onClick={() => set('semSite', !filters.semSite)}>
            <Globe className="h-3 w-3" /> Sem site
          </ToggleChip>
          <ToggleChip active={filters.followUpToday} onClick={() => set('followUpToday', !filters.followUpToday)}>
            Follow-up hoje
          </ToggleChip>
          <ToggleChip active={filters.followUpLate} onClick={() => set('followUpLate', !filters.followUpLate)}>
            Follow-up atrasado
          </ToggleChip>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_CRM_FILTERS)}
            disabled={!hasActiveCrmFilter(filters)}
            title="Limpar filtros"
          >
            <FilterX className="h-3.5 w-3.5" /> Limpar
          </Button>
        </div>
      </div>
    </div>
  );
}