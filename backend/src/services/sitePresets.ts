import { sectionTypes } from './websiteSchema';

export type SectionType = (typeof sectionTypes)[number];
export type ClimaKey = 'clean' | 'premium' | 'vibrante' | 'sobrio';

export interface Clima {
  rotulo: string;
  cores: Record<'background' | 'foreground' | 'primary' | 'primaryForeground' | 'accent' | 'accentForeground' | 'muted' | 'mutedForeground' | 'card' | 'cardForeground' | 'border', string>;
  fontes: { display: string; corpo: string; label: string };
}

export const CLIMAS: Record<ClimaKey, Clima> = {
  clean: {
    rotulo: 'Clean',
    cores: { background: '0 0% 100%', foreground: '222 22% 12%', primary: '187 60% 32%', primaryForeground: '0 0% 100%', accent: '43 86% 54%', accentForeground: '0 0% 12%', muted: '210 20% 97%', mutedForeground: '224 10% 42%', card: '0 0% 100%', cardForeground: '222 22% 12%', border: '220 13% 88%' },
    fontes: { display: 'Playfair Display', corpo: 'Source Sans 3', label: 'Space Grotesk' },
  },
  premium: {
    rotulo: 'Premium escuro',
    cores: { background: '225 25% 8%', foreground: '40 30% 94%', primary: '43 70% 52%', primaryForeground: '225 25% 8%', accent: '43 86% 60%', accentForeground: '0 0% 10%', muted: '225 20% 13%', mutedForeground: '225 10% 65%', card: '225 22% 11%', cardForeground: '40 30% 94%', border: '225 15% 22%' },
    fontes: { display: 'Cormorant Garamond', corpo: 'Jost', label: 'Space Grotesk' },
  },
  vibrante: {
    rotulo: 'Vibrante',
    cores: { background: '0 0% 100%', foreground: '240 25% 10%', primary: '16 85% 52%', primaryForeground: '0 0% 100%', accent: '187 70% 40%', accentForeground: '0 0% 100%', muted: '20 40% 96%', mutedForeground: '240 8% 40%', card: '0 0% 100%', cardForeground: '240 25% 10%', border: '20 20% 88%' },
    fontes: { display: 'Bricolage Grotesque', corpo: 'Sora', label: 'Space Grotesk' },
  },
  sobrio: {
    rotulo: 'Sóbrio',
    cores: { background: '40 30% 98%', foreground: '150 20% 12%', primary: '150 30% 22%', primaryForeground: '40 30% 98%', accent: '30 45% 45%', accentForeground: '0 0% 100%', muted: '40 20% 94%', mutedForeground: '150 8% 38%', card: '0 0% 100%', cardForeground: '150 20% 12%', border: '40 15% 86%' },
    fontes: { display: 'Libre Baskerville', corpo: 'Source Sans 3', label: 'IBM Plex Mono' },
  },
};

const base = { fundo: 'claro', fundoFoto: '', espacamento: 'normal', animacao: 'surgir', esconderNoCelular: false };

export interface Peca {
  rotulo: string;
  tipo: SectionType | null;
  campos: string[];
  padrao: Record<string, unknown>;
}

export const PECAS: Record<string, Peca> = {
  Nav: { rotulo: 'Menu do topo', tipo: 'header', campos: ['Nome no topo', 'Logo (imagem)', 'Links do menu', 'Texto do botão', 'Link do WhatsApp', 'Mostrar botão', 'Fixar no topo'], padrao: { logoTexto: 'Meu Negócio', logoImagem: '', links: [], botaoTexto: 'Agendar', whatsapp: '', mostrarBotao: true, fixarNoTopo: false } },
  Hero: { rotulo: 'Capa (primeira dobra)', tipo: 'hero', campos: ['Linha pequena de cima', 'Título', 'Frase de apoio', 'Foto principal', 'Botão principal', 'Link do botão principal', 'Botão secundário', 'Link do botão secundário', 'Desenho da capa'], padrao: { eyebrow: '', titulo: 'Meu Negócio', subtitulo: '', foto: '', botao1Texto: 'Falar no WhatsApp', botao1Link: '', botao2Texto: '', botao2Link: '#servicos', layout: 'foto-fundo', ...base } },
  Services: { rotulo: 'Serviços', tipo: 'services', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Serviços (ícone/título/descrição)', 'Desenho da lista', 'Mostrar ícones'], padrao: { eyebrow: 'Serviços', titulo: 'O que fazemos', subtitulo: '', itens: [], layout: 'cards3', mostrarIcones: true, ...base } },
  Gallery: { rotulo: 'Galeria de fotos', tipo: 'gallery', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Fotos (foto/legenda)', 'Desenho da grade', 'Ampliar foto ao clicar'], padrao: { eyebrow: 'Espaço', titulo: 'Nosso espaço', subtitulo: '', fotos: [], layout: 'grade3', ampliarAoClicar: true, ...base } },
  Options: { rotulo: 'Opções (acomodações, pacotes, planos)', tipo: 'features', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Opções (foto/título/descrição/detalhes/preço/botão)', 'Desenho dos cards'], padrao: { eyebrow: 'Opções', titulo: 'Escolha a ideal para você', subtitulo: '', itens: [], layout: 'cards3', ...base } },
  Location: { rotulo: 'Localização (mapa)', tipo: 'map', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Endereço completo', 'Ponto de referência', 'Desenho', 'Botão "Como chegar"'], padrao: { eyebrow: 'Localização', titulo: 'Onde estamos', subtitulo: '', endereco: '', referencia: '', layout: 'lado', mostrarComoChegar: true, ...base } },
  Pricing: { rotulo: 'Planos e preços', tipo: 'prices', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Planos (nome/descrição/preço/período/incluídos/botão/destaque/selo)', 'Desenho'], padrao: { eyebrow: 'Planos', titulo: 'Escolha seu plano', subtitulo: '', planos: [], layout: 'cards3', ...base } },
  Cardapio: { rotulo: 'Cardápio / lista de preços', tipo: 'menu', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Itens (categoria/nome/descrição/preço)', 'Desenho'], padrao: { eyebrow: 'Cardápio', titulo: 'Nosso cardápio', subtitulo: '', itens: [], layout: 'colunas2', ...base } },
  CTA: { rotulo: 'Chamada (faixa de destaque)', tipo: 'cta', campos: ['Frase de chamada', 'Frase de apoio', 'Texto do botão', 'Link do botão', 'Visual da faixa'], padrao: { titulo: 'Pronto pra começar?', subtitulo: '', botaoTexto: 'Falar no WhatsApp', botaoLink: '', visual: 'accent', espacamento: 'compacto', esconderNoCelular: false } },
  Team: { rotulo: 'Equipe', tipo: 'team', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Pessoas (foto/nome/cargo/descrição)', 'Desenho'], padrao: { eyebrow: 'Equipe', titulo: 'Quem faz acontecer', subtitulo: '', pessoas: [], layout: 'cards3', ...base } },
  Stats: { rotulo: 'Números (prova rápida)', tipo: 'features', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Números (número/rótulo)'], padrao: { eyebrow: '', titulo: '', subtitulo: '', itens: [], ...base } },
  AntesDepois: { rotulo: 'Antes e depois (arrasta pra comparar)', tipo: 'gallery', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Foto do ANTES', 'Foto do DEPOIS', 'Etiqueta da esquerda', 'Etiqueta da direita'], padrao: { eyebrow: 'Resultados', titulo: 'Antes e depois', subtitulo: 'Arraste pra comparar.', fotoAntes: '', fotoDepois: '', rotuloAntes: 'Antes', rotuloDepois: 'Depois', ...base } },
  WhatsFlutuante: { rotulo: 'Botão flutuante de WhatsApp', tipo: null, campos: ['Link do WhatsApp', 'Texto do leitor de tela'], padrao: { whatsapp: '', rotulo: 'Falar no WhatsApp' } },
  Testimonials: { rotulo: 'Depoimentos', tipo: 'testimonials', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Mostrar 5 estrelas', 'Depoimentos (frase/autor)'], padrao: { eyebrow: 'Prova social', titulo: 'Quem já confiou', subtitulo: '', mostrarEstrelas: true, itens: [], ...base } },
  About: { rotulo: 'Sobre', tipo: 'about', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Texto de apresentação', 'Foto', 'Lado da foto', 'Números de destaque'], padrao: { eyebrow: 'Sobre', titulo: 'Quem somos', subtitulo: '', texto: '', foto: '', fotoLado: 'direita', marcos: [], ...base } },
  FAQ: { rotulo: 'Perguntas frequentes', tipo: 'faq', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Perguntas (pergunta/resposta)'], padrao: { eyebrow: 'Dúvidas', titulo: 'Perguntas frequentes', subtitulo: '', itens: [], ...base } },
  Contact: { rotulo: 'Contato', tipo: 'contact', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Telefone', 'Link do WhatsApp', 'Texto do botão', 'Endereço', 'Horários (dias/horas)', 'Link de incorporar do Google Maps'], padrao: { eyebrow: 'Contato', titulo: 'Fale com a gente', subtitulo: '', telefone: '', whatsapp: '', botaoTexto: 'Chamar no WhatsApp', endereco: '', horarios: [], mapaLink: '', ...base } },
  Catalog: { rotulo: 'Catálogo (produtos/serviços)', tipo: 'features', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Desenho da grade', 'Mostrar preços', 'Filtro por categoria', 'WhatsApp do botão "Pedir"'], padrao: { eyebrow: 'Catálogo', titulo: 'Nossos produtos', subtitulo: '', layout: 'grade3', mostrarPreco: true, mostrarFiltro: true, whatsapp: '', ...base } },
  HeroAnimado: { rotulo: 'Capa animada', tipo: 'hero', campos: ['Linha pequena de cima', 'Título', 'Frase de apoio', 'Botão principal', 'Link do botão principal', 'Botão secundário', 'Link do botão secundário', 'Quadros da animação'], padrao: { eyebrow: '', titulo: 'Meu Negócio', subtitulo: '', botao1Texto: 'Falar no WhatsApp', botao1Link: '', botao2Texto: '', botao2Link: '#servicos', frames: [] } },
  Agendamento: { rotulo: 'Agendamento (sistema)', tipo: 'form', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Serviços agendáveis', 'Campos extras do formulário', 'Texto do botão', 'WhatsApp'], padrao: { eyebrow: 'Agende', titulo: 'Marque seu horário', subtitulo: 'Preencha e a gente confirma rapidinho.', servicos: [], camposExtras: [], botaoTexto: 'Enviar agendamento', whatsapp: '', ...base } },
  PainelAdmin: { rotulo: 'Painel do dono (sistema)', tipo: null, campos: ['Título do painel'], padrao: { titulo: 'Painel de agendamentos' } },
  Video: { rotulo: 'Vídeo (YouTube)', tipo: 'features', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'Link do vídeo no YouTube', 'Legenda'], padrao: { eyebrow: '', titulo: 'Assista', subtitulo: '', url: '', legenda: '', ...base } },
  Formulario: { rotulo: 'Formulário (respostas no WhatsApp)', tipo: 'form', campos: ['Linha pequena de cima', 'Título da seção', 'Frase de apoio', 'WhatsApp que recebe', 'Perguntas do formulário', 'Texto do botão', 'Aviso'], padrao: { eyebrow: 'Contato', titulo: 'Peça seu orçamento', subtitulo: 'Responda rapidinho e receba no WhatsApp.', whatsapp: '', campos: [{ rotulo: 'Seu nome', longo: false }, { rotulo: 'Seu telefone', longo: false }, { rotulo: 'O que você precisa?', longo: true }], botaoTexto: 'Enviar pelo WhatsApp', aviso: '', ...base } },
  Footer: { rotulo: 'Rodapé', tipo: 'footer', campos: ['Nome do negócio', 'Descrição', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'WhatsApp'], padrao: { nome: 'Meu Negócio', descricao: '', instagram: '', facebook: '', youtube: '', tiktok: '', whatsapp: '' } },
};

export const PECAS_SISTEMA = new Set(['Agendamento', 'PainelAdmin']);

export interface NichoPreset {
  slug: string;
  rotulo: string;
  clima: ClimaKey;
  pecas: string[];
  keywords: string[];
  imageHints: { hero: string; about: string; gallery: string };
  ctaLabel: string;
}

export const NICHO_PRESETS: NichoPreset[] = [
  {
    slug: 'pizzaria', rotulo: 'Pizzaria / Forneria', clima: 'vibrante',
    pecas: ['Nav', 'Hero', 'Cardapio', 'Gallery', 'About', 'Testimonials', 'Location', 'FAQ', 'Contact', 'Footer'],
    keywords: ['pizza', 'pizzaria', 'forneria', 'esfiha', 'esfirra', 'calabresa', 'napolitana', 'pizzaiolo', 'brasa', 'forno a lenha'],
    imageHints: { hero: 'wood fired pizza oven flames pizzaiolo dough', about: 'pizzeria kitchen chef preparing dough', gallery: 'pizza margherita close up melted cheese' },
    ctaLabel: 'Fazer um pedido',
  },
  {
    slug: 'restaurante', rotulo: 'Restaurante / Alimentação', clima: 'vibrante',
    pecas: ['Nav', 'Hero', 'Cardapio', 'About', 'Gallery', 'Testimonials', 'Location', 'FAQ', 'Contact', 'Footer'],
    keywords: ['restaurant', 'restaurante', 'food', 'comida', 'alimenta', 'lanchonete', 'hamburg', 'burger', 'bar', 'botequim', 'churrasc', 'grelh', 'espet', 'self service', 'marmit', 'cantina', 'bistro', 'cafe', 'cafeteria', 'doceria', 'padaria', 'confeitaria', 'sorveter', 'acai', 'japonesa', 'sushi', 'italiana', 'chinesa'],
    imageHints: { hero: 'restaurant plated gourmet dish on table', about: 'restaurant dining room warm interior', gallery: 'assorted dishes and food ingredients close up' },
    ctaLabel: 'Fazer um pedido',
  },
  {
    slug: 'beleza', rotulo: 'Beleza / Estética', clima: 'premium',
    pecas: ['Nav', 'Hero', 'Services', 'Team', 'Gallery', 'Pricing', 'Testimonials', 'AntesDepois', 'Contact', 'Footer'],
    keywords: ['barber', 'barbearia', 'barbeiro', 'beauty', 'salao', 'salão', 'cabeleireiro', 'cabelo', 'hair', 'estetica', 'estética', 'unhas', 'nail', 'manicure', 'pedicure', 'sobrancelha', 'depilacao', 'depilação', 'spa', 'massagem', 'maquiagem', 'cosmetic', 'sobrancelhas'],
    imageHints: { hero: 'modern barbershop styling chair barber kit', about: 'barber or stylist working on client hair', gallery: 'haircut beard grooming nails detail close up' },
    ctaLabel: 'Agendar horário',
  },
  {
    slug: 'auto', rotulo: 'Oficina / Automotivo', clima: 'clean',
    pecas: ['Nav', 'Hero', 'Services', 'Stats', 'About', 'Gallery', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['auto_repair', 'auto repair', 'oficina', 'mecanica', 'mecânica', 'carro', 'automotiv', 'pneu', 'funilaria', 'lava', 'car wash', 'concessionaria', 'car dealer', 'moto', 'autopecas', 'autopeças', 'revisao', 'revisão'],
    imageHints: { hero: 'car mechanic working in professional auto repair shop', about: 'clean automotive workshop interior with car lift', gallery: 'engine parts wrenches and car detail close up' },
    ctaLabel: 'Solicitar orçamento',
  },
  {
    slug: 'saude', rotulo: 'Clínica / Saúde', clima: 'clean',
    pecas: ['Nav', 'Hero', 'Services', 'About', 'Team', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['dentist', 'dentista', 'odonto', 'doctor', 'clinic', 'clinica', 'clínica', 'medic', 'fisio', 'physiotherapist', 'psicolog', 'nutri', 'saude', 'saúde', 'health', 'hospital', 'veterinar', 'veterinari', 'farmacia', 'farmácia', 'pharmacy', 'laborator', 'exame', 'dermat', 'fonoaudiolog', 'pediatra'],
    imageHints: { hero: 'modern bright medical clinic reception interior', about: 'doctor or dentist attending patient in clean office', gallery: 'medical examination room equipment detail' },
    ctaLabel: 'Agendar atendimento',
  },
  {
    slug: 'fitness', rotulo: 'Academia / Fitness', clima: 'vibrante',
    pecas: ['Nav', 'Hero', 'Services', 'Pricing', 'Team', 'Stats', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['gym', 'academia', 'fitness', 'crossfit', 'personal', 'pilates', 'yoga', 'luta', 'funcional', 'musculacao', 'musculação', 'box'],
    imageHints: { hero: 'modern gym interior with weights and equipment', about: 'personal trainer coaching athlete workout', gallery: 'weight training dumbbells and equipment' },
    ctaLabel: 'Começar agora',
  },
  {
    slug: 'eletrico', rotulo: 'Elétrica / Energia / Motores', clima: 'sobrio',
    pecas: ['Nav', 'Hero', 'Services', 'Stats', 'About', 'Gallery', 'FAQ', 'Contact', 'Footer'],
    keywords: ['eletrico', 'elétrica', 'eletrica', 'eletricista', 'energia', 'solar', 'motores', 'motor', 'gerador', 'geradores', 'bomba', 'bombas', 'motobomba', 'eletromecanica', 'eletromecânica', 'compressor', 'painel solar', 'inversor', 'subestacao', 'instalacao eletrica', 'instalação elétrica', 'gerador de energia', 'quadro de distribuição', 'eletrochoque', 'comando eletrico', 'comando elétrico'],
    imageHints: { hero: 'industrial electric motor and generator in workshop', about: 'electrician technician repairing motor with tools', gallery: 'generators pumps cables and control panel detail' },
    ctaLabel: 'Solicitar orçamento',
  },
  {
    slug: 'construcao', rotulo: 'Construção / Obras', clima: 'sobrio',
    pecas: ['Nav', 'Hero', 'Services', 'About', 'Gallery', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['constru', 'construct', 'obra', 'obras', 'reforma', 'reformas', 'pedreiro', 'engenharia', 'engenh civil', 'arquitet', 'projetos', 'tijolo', 'alvenaria', 'construcao civil', 'construção civil', 'telhado', 'cobertura', 'piso', 'revestimento'],
    imageHints: { hero: 'construction site workers building brick wall', about: 'engineer reviewing blueprints on building site', gallery: 'construction materials tools and framework detail' },
    ctaLabel: 'Solicitar orçamento',
  },
  {
    slug: 'agro', rotulo: 'Agronegócio / Fazenda', clima: 'sobrio',
    pecas: ['Nav', 'Hero', 'Services', 'About', 'Gallery', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['agro', 'agricola', 'agrícola', 'fazenda', 'fazendas', 'plantio', 'colheita', 'trator', 'tratores', 'pecuaria', 'pecuária', 'granja', 'semente', 'adubo', 'irrigacao', 'irrigação', 'agricultur'],
    imageHints: { hero: 'tractor working in green agricultural field', about: 'farmer inspecting crops plantation', gallery: 'harvest farm machinery and produce detail' },
    ctaLabel: 'Solicitar orçamento',
  },
  {
    slug: 'loja', rotulo: 'Loja / Comércio', clima: 'clean',
    pecas: ['Nav', 'Hero', 'Catalog', 'About', 'Gallery', 'Testimonials', 'Location', 'Contact', 'Footer'],
    keywords: ['store', 'loja', 'shop', 'clothing', 'roupas', 'shoe', 'calcado', 'calçado', 'furniture', 'moveis', 'móveis', 'electronics', 'eletronic', 'eletrodomestico', 'pet', 'petshop', 'pet shop', 'florist', 'floricultura', 'boutique', 'variedades', 'mercado', 'supermarket', 'supermercado', 'material', 'hardware', 'ferramenta', 'presente', 'papelaria', 'otica', 'ótica', 'joalheria', 'bijuteria', 'livraria', 'brinquedo'],
    imageHints: { hero: 'retail store interior with product display shelves', about: 'shop owner arranging products on counter', gallery: 'products arranged on shelves close up detail' },
    ctaLabel: 'Falar com a loja',
  },
  {
    slug: 'hospedagem', rotulo: 'Hospedagem / Turismo', clima: 'premium',
    pecas: ['Nav', 'Hero', 'Options', 'Gallery', 'About', 'Testimonials', 'Location', 'FAQ', 'Contact', 'Footer'],
    keywords: ['lodging', 'hotel', 'pousada', 'hosped', 'turismo', 'travel', 'agencia de viagens', 'chale', 'chalé', 'hostel', 'resort', 'airbnb', 'passeio', 'pousada'],
    imageHints: { hero: 'hotel or guesthouse well lit room with view', about: 'cozy inn common area and reception hall', gallery: 'hotel rooms pool and breakfast table detail' },
    ctaLabel: 'Reservar',
  },
  {
    slug: 'servicos', rotulo: 'Serviços / Escritório', clima: 'sobrio',
    pecas: ['Nav', 'Hero', 'Services', 'About', 'Stats', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['lawyer', 'advocacia', 'advogado', 'accounting', 'contabilidade', 'real_estate', 'imobiliaria', 'imobiliária', 'insurance', 'seguro', 'consultoria', 'plumber', 'encanador', 'general_contractor', 'contractor', 'construtor', 'painter', 'pintor', 'servico', 'serviço', 'assistencia', 'assistência', 'reform', 'marmoraria', 'granito', 'vidracaria', 'serralheria', 'metalurgica', 'metalúrgica', 'usinagem', 'fundicao', 'fundição', 'caldeiraria', 'fabrica', 'industrial', 'fotografo', 'fotógrafo', 'fotografia', 'estudio', 'studio', 'impressora', 'seguranca', 'segurança', 'dedetizacao', 'dedetização', 'limpeza', 'jardim', 'paisagismo'],
    imageHints: { hero: 'professional technician working with tools on site', about: 'service team meeting in office or workshop', gallery: 'finished service work and tools material detail' },
    ctaLabel: 'Solicitar orçamento',
  },
  {
    slug: 'educacao', rotulo: 'Educação / Cursos', clima: 'clean',
    pecas: ['Nav', 'Hero', 'Services', 'About', 'Team', 'Pricing', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    keywords: ['school', 'escola', 'university', 'universidade', 'curso', 'treinamento', 'aula', 'educacao', 'educação', 'colegio', 'colégio', 'idiomas', 'creche'],
    imageHints: { hero: 'bright modern classroom with students and desks', about: 'teacher and students learning together', gallery: 'school supplies books and campus detail' },
    ctaLabel: 'Fazer matrícula',
  },
];

export const GENERIC_PRESET: NichoPreset = {
  slug: 'generico', rotulo: 'Negócio local', clima: 'clean',
  pecas: ['Nav', 'Hero', 'Services', 'About', 'Gallery', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
  keywords: [],
  imageHints: { hero: 'local business storefront with signage', about: 'business workspace interior with people working', gallery: 'products and services workspace detail' },
  ctaLabel: 'Falar com a empresa',
};

const SERIF_FONTS = new Set(['Playfair Display', 'Cormorant Garamond', 'Libre Baskerville']);

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function resolveNiche(...values: (string | null | undefined)[]): NichoPreset {
  const haystack = values.filter(Boolean).map(value => normalize(String(value))).join(' ').trim();
  if (!haystack) return GENERIC_PRESET;
  const words = new Set(haystack.split(' ').filter(Boolean));
  for (const preset of NICHO_PRESETS) {
    const matched = preset.keywords.some(keyword => {
      const term = normalize(keyword);
      if (!term) return false;
      return term.length <= 4 ? words.has(term) : haystack.includes(term);
    });
    if (matched) return preset;
  }
  return GENERIC_PRESET;
}

export function tokenToHex(token: string): string {
  const match = token.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) throw new Error(`Token de cor inválido: ${token}`);
  const hue = Number(match[1]) % 360;
  const saturation = Number(match[2]) / 100;
  const lightness = Number(match[3]) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, second, 0] : hue < 120 ? [second, chroma, 0] : hue < 180 ? [0, chroma, second] : hue < 240 ? [0, second, chroma] : hue < 300 ? [second, 0, chroma] : [chroma, 0, second];
  const channel = (value: number) => Math.round((value + offset) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export interface ClimaTheme { primary: string; accent: string; background: string; text: string; font: 'sans' | 'serif'; radius: number }

export function climaTheme(clima: ClimaKey): ClimaTheme {
  const { cores, fontes } = CLIMAS[clima];
  return { primary: tokenToHex(cores.primary), accent: tokenToHex(cores.accent), background: tokenToHex(cores.background), text: tokenToHex(cores.foreground), font: SERIF_FONTS.has(fontes.display) ? 'serif' : 'sans', radius: 24 };
}

export function presetPrompt(preset: NichoPreset): string {
  const clima = CLIMAS[preset.clima];
  const cores = Object.entries(clima.cores).map(([token, value]) => `${token}: hsl(${value})`).join(', ');
  const estrutura = preset.pecas.map((key, index) => `${index + 1}. ${key} — ${PECAS[key].rotulo}${PECAS[key].tipo ? ` (type: ${PECAS[key].tipo})` : ''}`).join('\n');
  const campos = preset.pecas.map(key => `- ${key}: ${PECAS[key].campos.join(', ')}`).join('\n');
  return `Nicho identificado: ${preset.rotulo}. Clima de marca obrigatório: ${clima.rotulo} (${cores}). Fontes: display ${clima.fontes.display}, corpo ${clima.fontes.corpo}, labels ${clima.fontes.label}.
Monte as seções exatamente nesta ordem, usando um item de "sections" por peça (para Nav use type "header", para Footer use type "footer"):
${estrutura}
Campos esperados por peça (preencha só com fatos fornecidos; deixe vazio o desconhecido):
${campos}
Regras obrigatórias de qualidade:
- Nunca crie seção vazia: se a peça não tiver conteúdo real a partir dos dados, omita o item de "sections" correspondente (exceto header, hero e footer).
- Não repita o endereço nem o contato em mais de uma seção além do necessário; mostre endereço no principal e, no máximo, uma versão curta no rodapé.
- CTA principal do hero deve ser voltado para o nicho (${preset.ctaLabel}) em vez de "Fale conosco" quando houver WhatsApp; desapareça o texto se não houver contato.
- Não invente serviços, preços, avaliações, depoimentos, equipe, anos de mercado, certificados ou produtos. Trabalhe somente com os fatos fornecidos.
- imageQueries.hero, imageQueries.about e imageQueries.gallery devem descrever assuntos e materiais VERIFICÁVEIS deste negócio, nunca conceitos vagos; deixe cada query específica para o local da imagem.`; 
}

export function presetImageQuery(preset: NichoPreset, placement: keyof NichoPreset['imageHints']): string {
  return preset.imageHints[placement];
}
