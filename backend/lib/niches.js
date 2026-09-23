// Catálogo de nichos usado tanto no filtro do frontend quanto para montar a
// query de busca enviada à Places API. `keyword` é o termo em pt-BR usado na
// busca textual (ex: "barbearia em Sinop, MT").
export const NICHES = [
  { value: 'barbearia', label: 'Barbearia', keyword: 'barbearia' },
  { value: 'salao_beleza', label: 'Salão de beleza', keyword: 'salão de beleza' },
  { value: 'estetica', label: 'Clínica de estética', keyword: 'clínica de estética' },
  { value: 'academia', label: 'Academia', keyword: 'academia' },
  { value: 'marmoraria', label: 'Marmoraria', keyword: 'marmoraria' },
  { value: 'serralheria', label: 'Serralheria', keyword: 'serralheria' },
  { value: 'vidracaria', label: 'Vidraçaria', keyword: 'vidraçaria' },
  { value: 'marcenaria', label: 'Marcenaria', keyword: 'marcenaria' },
  { value: 'oficina_mecanica', label: 'Oficina mecânica', keyword: 'oficina mecânica' },
  { value: 'auto_pecas', label: 'Auto peças', keyword: 'loja de auto peças' },
  { value: 'borracharia', label: 'Borracharia', keyword: 'borracharia' },
  { value: 'lava_rapido', label: 'Lava-rápido', keyword: 'lava rápido' },
  { value: 'restaurante', label: 'Restaurante', keyword: 'restaurante' },
  { value: 'pizzaria', label: 'Pizzaria', keyword: 'pizzaria' },
  { value: 'hamburgueria', label: 'Hamburgueria', keyword: 'hamburgueria' },
  { value: 'padaria', label: 'Padaria', keyword: 'padaria' },
  { value: 'confeitaria', label: 'Confeitaria', keyword: 'confeitaria' },
  { value: 'sorveteria', label: 'Sorveteria', keyword: 'sorveteria' },
  { value: 'petshop', label: 'Pet shop', keyword: 'pet shop' },
  { value: 'clinica_veterinaria', label: 'Clínica veterinária', keyword: 'clínica veterinária' },
  { value: 'clinica_odontologica', label: 'Clínica odontológica', keyword: 'clínica odontológica' },
  { value: 'advocacia', label: 'Escritório de advocacia', keyword: 'escritório de advocacia' },
  { value: 'contabilidade', label: 'Escritório de contabilidade', keyword: 'escritório de contabilidade' },
  { value: 'imobiliaria', label: 'Imobiliária', keyword: 'imobiliária' },
  { value: 'loja_roupas', label: 'Loja de roupas', keyword: 'loja de roupas' },
  { value: 'material_construcao', label: 'Loja de materiais de construção', keyword: 'loja de materiais de construção' },
  { value: 'farmacia', label: 'Farmácia', keyword: 'farmácia' },
  { value: 'papelaria', label: 'Papelaria', keyword: 'papelaria' },
  { value: 'floricultura', label: 'Floricultura', keyword: 'floricultura' },
  { value: 'chaveiro', label: 'Chaveiro', keyword: 'chaveiro' },
  { value: 'distribuidora_bebidas', label: 'Distribuidora de bebidas', keyword: 'distribuidora de bebidas' },
  { value: 'estudio_tatuagem', label: 'Estúdio de tatuagem', keyword: 'estúdio de tatuagem' },
  { value: 'escola_idiomas', label: 'Escola de idiomas', keyword: 'escola de idiomas' },
  { value: 'autoescola', label: 'Autoescola', keyword: 'autoescola' },
  { value: 'seguranca_eletronica', label: 'Segurança eletrônica', keyword: 'empresa de segurança eletrônica' },
  { value: 'energia_solar', label: 'Energia solar', keyword: 'empresa de energia solar' },
  { value: 'consultoria', label: 'Consultoria empresarial', keyword: 'consultoria empresarial' },
  { value: 'marketing', label: 'Agência de marketing', keyword: 'agência de marketing' },
];

export function nicheByValue(value) {
  return NICHES.find((n) => n.value === value) || null;
}
