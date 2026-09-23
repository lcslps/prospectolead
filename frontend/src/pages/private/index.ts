export { default as Criar } from './Criar';
export { default as Leads } from './Leads';
export { default as Crm } from './Crm';
export { default as LeadDetail } from './LeadDetail';
export { default as Projetos } from './Projetos';
export { default as ProjetoPreview } from './ProjetoPreview';

import { CirclePlus, Search, KanbanSquare, Globe } from 'lucide-react';
import type { NavItem } from '../../components/layout';

export const privateNav: NavItem[] = [
  { id: 'leads', label: 'Leads', icon: Search, desc: 'Buscar negócios locais' },
  { id: 'crm', label: 'CRM', icon: KanbanSquare, desc: 'Gerenciar contatos' },
  { id: 'criar', label: 'Criar', icon: CirclePlus, desc: 'Gerador de sites' },
  { id: 'projetos', label: 'Projetos', icon: Globe, desc: 'Sites já gerados' },
];
