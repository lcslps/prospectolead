import type { Lead } from '@prisma/client';
import { businessSchema, type BusinessData } from './siteArtefactSchema';

/** Converts CRM/Places records into the only business shape accepted by the planner. */
export function normalizeBusiness(lead: Lead): BusinessData {
  let digits = (lead.telefoneInternacional || lead.telefone || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return businessSchema.parse({
    googlePlaceId: lead.googlePlaceId,
    name: lead.nome,
    category: lead.categoria || lead.nicho || '',
    categories: [lead.categoria, lead.nicho].filter((value): value is string => Boolean(value)),
    city: lead.cidade || '', state: lead.estado || '', country: 'Brasil',
    address: lead.endereco || '', phone: lead.telefone || lead.telefoneInternacional || '',
    whatsapp: digits ? `https://wa.me/${digits}` : '', website: lead.site || '',
    rating: lead.nota == null ? '' : String(lead.nota), reviewCount: lead.quantidadeAvaliacoes == null ? '' : String(lead.quantidadeAvaliacoes),
    mapUrl: lead.googleMapsUrl || '', hours: '',
  });
}
