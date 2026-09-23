export { default as Criar } from './Criar';
import { CirclePlus } from 'lucide-react';
import type { NavItem } from '../../components/layout';

export type PrivatePageId = 'criar';

export const privateNav: NavItem[] = [
  { id: 'criar', label: 'Criar', icon: CirclePlus, desc: 'Gerador de sites' },
];
