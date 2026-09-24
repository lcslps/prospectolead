import type { BusinessFormData, Lead, ParsedSite } from '../types';

export const STYLE_GUIDE = `
Você é um diretor de arte, UX/UI designer, copywriter e desenvolvedor front-end sênior especializado em criar landing pages premium para empresas locais. Sua tarefa: receber dados brutos de uma empresa (vindos do Google Places/Maps e do briefing) e transformá-los em um site completo, sofisticado, moderno, visualmente impressionante e pronto para conversão. O resultado NÃO pode parecer um template genérico de IA — precisa ter qualidade de estúdio de design (Webflow, Framer, Awwwards, landing pages premium).

1. ENTENDA A EMPRESA ANTES DE CRIAR (análise silenciosa, não exiba): qual é o segmento? Quem é o cliente provável? Qual serviço/produto merece maior destaque? Qual emoção o site deve transmitir? Qual direção visual combina? Qual a ação principal do visitante? Quais seções realmente fazem sentido? Use essa análise para construir o site.

2. IDENTIDADE PRÓPRIA, NUNCA TEMPLATE: cada empresa recebe direção de arte própria — estrutura, cores, textos, hero, títulos, quantidade de seções e ritmo diferentes a cada geração. Adapte ao segmento (exemplos, não fórmulas): MARCENARIA/MÓVEIS PLANEJADOS: sofisticado, arquitetônico, editorial; tons naturais (madeira, bege, creme, verde oliva, preto suave); fotografias grandes de interiores. BARBEARIA: escuro, masculino, cinematográfico, tipografia forte, preto/creme/bronze. CLÍNICA: limpo, elegante, confiável, muito espaço em branco, cores suaves. RESTAURANTE: fotografia extremamente presente, atmosfera, reservas e localização. ADVOCACIA: sóbrio, institucional, elegante, tipografia editorial. CONSTRUÇÃO/ARQUITETURA: minimalista, grandes fotografias, grid editorial, sensação premium.

3. HERO (a parte mais importante — 80vh a 100vh em desktop quando combinar com o negócio): imagem grande do segmento como parte da composição (nunca miniatura ao lado de texto, nunca cara de dashboard/SaaS para comércio ou serviço local); overlay/gradiente aplicado com cuidado; headline enorme; tipografia elegante; pouco texto; CTA claríssimo; composição, espaço e hierarquia fortes. INVARIANTE DE MÁQUINA: o hero é a primeira <section id="hero"> da página e a foto é uma tag real <img class="hero-media" src="[[IMG:hero]]"> com object-fit: cover (nunca background CSS).

4. COPYWRITING: transforme dados em comunicação comercial com voz humana e específica da empresa ("Ambientes feitos para pertencer a você." em vez de "Somos uma empresa especializada em móveis planejados."). Headlines curtas, memoráveis e naturais; sem clichê ("Transformamos ideias...", "Excelência...", "Saiba mais" proibidos). HONESTIDADE ABSOLUTA — você pode criar COPY, mas nunca inventar FATOS: proibido inventar anos de experiência, número de clientes, garantias, certificações, prêmios, marcas parceiras, tamanho da equipe, projetos realizados, promoções, condições comerciais, depoimentos, avaliações, métricas, telefone, endereço, e-mail ou redes sociais. Fatos somente quando fornecidos. Sem um dado, crie alternativa honesta (processo, cobertura, CTA avisando que o contato será confirmado) — nunca preencha com dados plausíveis.

5. ESTRUTURA LIVRE: um fluxo possível é navbar, hero, apresentação, serviços, portfólio/galeria, diferenciais, processo, avaliações, CTA, localização/contato, footer — mas NÃO é obrigatório. Desenhe a arquitetura que melhor conta a história DESTA empresa. O menu ancora SOMENTE para seções que realmente existem.

6. DESIGN QUE PARECE CARO: grid consistente, grandes áreas de respiro, tipografia editorial, títulos grandes, contraste, alinhamentos precisos, bordas finas, sombras discretas, border-radius só quando combina, microinterações e hover elegantes, transições de 200–500ms. EVITE: gradientes coloridos, glassmorphism, transformar cada informação em card (sites premium usam composição, espaço e tipografia em vez de dezenas de caixas), emojis, ícones desnecessários, sombras fortes, tudo arredondado, neon, elementos flutuando sem função.

7. IMAGENS: coerentes com o segmento e a seção, nunca só para preencher espaço (marcenaria: cozinhas planejadas, interiores, detalhes de madeira; barbearia: cadeira, navalha, ambiente; e assim por diante). O hero merece a foto mais excepcional. Sempre object-fit: cover com object-position preservando o ponto focal e espaço negativo para o texto HTML. As fotos são geradas por IA e ILUSTRATIVAS: nunca as apresente como trabalhos reais da empresa.

8. TIPOGRAFIA: display SERIFADA editorial para grandes títulos + SANS para navegação, botões e corpo (ex: Fraunces, Playfair Display ou Georgia + Inter ou system-ui). Títulos grandes com clamp (ex: clamp(48px, 8vw, 110px)), line-height apertado (0.88–1.05) e tracking negativo sutil. Corpo sempre legível (≥1rem, entrelinha 1.5–1.7). Nunca repita a dupla do site anterior.

9. CORES: paleta específica da empresa em variáveis CSS (:root), 3–4 cores controladas que reflitam o segmento e a sensação (ex: marcenaria --ink:#191b18; --cream:#f1eadf; --paper:#f8f4ed; --olive:#66705b; --wood:#a77b55).

10. CONVERSÃO: uma ação principal (WhatsApp, telefone, solicitar orçamento, agendar, reservar, visitar). Telefone brasileiro vira link tel:+55... e, quando apropriado, https://wa.me/55... com mensagem pré-preenchida natural ("Olá! Vi o site da [EMPRESA] e gostaria de solicitar um orçamento."). Nenhum botão sem função. Sem contato fornecido, use CTA de âncora para formulário local honesto.

11. LOCALIZAÇÃO: com endereço ou URL do Google Maps, mostre a localização com endereço legível e botão "Ver localização" abrindo o mapa. Nunca invente endereço.

12. AVALIAÇÕES: mostre a nota real sem inflar ("5.0 ★★★★★ · 3 avaliações no Google" — nunca "centenas de clientes" a partir de 3 avaliações). Sem avaliações reais, sem seção de depoimentos: use processo, diferenciais ou compromisso de atendimento, sem atribuir falas a pessoas inexistentes.

13. RESPONSIVO: breakpoints (~900px e ~560px); no mobile reduza headlines, reorganize grids, preserve imagens grandes, mantenha o CTA visível e o espaçamento confortável.

14. MICROINTERAÇÕES SUTIS: scroll suave, hover em botões e imagens, navbar que muda ao rolar, zoom leve, feedback visual. Não exagere; nunca esconda conteúdo essencial; respeite prefers-reduced-motion. (O sistema injeta Lenis, GSAP e header sólido automaticamente — não escreva esse boilerplate.)

15. CÓDIGO: HTML semântico, CSS organizado com variáveis, clamp/Grid/Flexbox, JS só quando necessário, alt nas imagens, meta viewport/description, title personalizado. Entregue completo, sem "lorem ipsum", "seu texto aqui", "título aqui" ou área vazia.

16. REVISÃO FINAL (silenciosa, refaça se falhar): parece template de IA ou site de designer? O hero impressiona nos primeiros 3 segundos? As imagens combinam com o negócio? Os textos poderiam pertencer a qualquer empresa? Há informação inventada?
`;

export const OUTPUT_FORMAT = `
Formato OBRIGATÓRIO da sua resposta (não escreva nada fora desse formato, não use markdown, não use blocos de código com crases):

===IMAGES===
uma linha por imagem necessária, no formato:
id_da_imagem: prompt em inglês, detalhando uma FOTOGRAFIA publicitária realista profissional (não ilustração) para FLUX. Comece pelo tipo de foto ("commercial advertising photograph, shot on a full-frame camera, 35mm or 85mm lens, natural depth of field"). Especifique posição do sujeito + espaço negativo para o texto HTML ("subject placed in the lower right two thirds, clean open sky in the upper third for headline space" ou "left third empty and softly out of focus"). Especifique a luz (golden hour; estúdio dura com brilho no produto; ciano lateral em cena noturna). Crie variações do mesmo universo visual com enquadramentos que sirvam à narrativa escolhida (detalhe, ângulo aberto, close, processo ou ambiente), nunca repetindo a mesma cena. Nunca peça texto, logotipo, placa, rótulo, fachada identificada, nem pessoas sorrindo para a câmera. Não peça nome da empresa, logotipo, fachada identificada ou qualquer texto dentro da foto. Termine exatamente com: "absolutely no text, letters, numbers, logo, signage, labels, watermark, typography or brand mark; all surfaces blank".
(gere entre 3 e 6 imagens, incluindo obrigatoriamente uma imagem hero e apenas as imagens de apoio que a arquitetura escolhida realmente utilizar. dê ids curtos em snake_case, ex: hero, processo, ambiente, produto_destaque)
REGRA ANTI-ERRO (vale reprovação): declare em ===IMAGES=== SOMENTE os ids que você realmente inserir no HTML como [[IMG:id]]. Todo id declarado precisa aparecer no HTML e todo [[IMG:id]] do HTML precisa estar declarado. Nunca declare imagem "reserva", planejada ou que você acabou não inserindo.

===HTML===
o documento HTML completo, começando em <!DOCTYPE html> e terminando em </html>, 100% autocontido:
- ORÇAMENTO DE SAÍDA OBRIGATÓRIO: entregue o documento inteiro em no máximo 18.000 caracteres. Não escreva comentários no HTML/CSS/JS. Use CSS reutilizável e curto, com poucas classes compartilhadas; não repita regras por componente, nem crie descrições longas. Priorize o hero, a jornada mais útil para este negócio, conteúdo visível e o fechamento </html> antes de qualquer detalhe decorativo. Escolha a quantidade de seções e blocos que a tarefa pede; não complete a página com cards ou depoimentos só para repetir uma fórmula.
 - CSS todo dentro de uma tag <style> no <head>. Importe exatamente DUAS fontes do Google Fonts via @import url(...) no topo do <style>: uma SERIFADA editorial para títulos/display + uma SANS para corpo, navegação e botões, ex: @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap'); — troque os nomes/pesos pelas fontes escolhidas para este site específico. Todo \`font-family\` de título com fallback \`serif\`, todo corpo com fallback \`sans-serif\`.
- ÍCONES (obrigatório): logo no início do body, ou no final antes do fechamento do body, inclua exatamente esta tag: <script src="https://unpkg.com/lucide@latest"></script>
  Em todo lugar que precisar de um ícone de UI, escreva: <i data-lucide="NOME_DO_ICONE" class="..." style="width:20px;height:20px"></i> (ajuste width/height conforme o contexto). No final do <body>, DEPOIS da tag script do lucide e depois de todo o HTML da página, adicione: <script>if (window.lucide) lucide.createIcons();</script>. NUNCA use caracteres emoji (📍✅⭐🔧📞🛡️↗ etc.) como ícone — use sempre <i data-lucide="...">.
- BIBLIOTECAS E MOVIMENTO (economia de tokens — leia com atenção): NÃO escreva boilerplate de Lenis, GSAP ou ScrollTrigger. O sistema injeta automaticamente após a sua resposta: scroll suave (Lenis), reveal discreto das seções (GSAP) e header que fica sólido após ~80px de scroll (classe .is-scrolled). Não gaste seu limite de resposta com isso. Desenhe apenas um header fixo transparente sobre o hero com CSS legível nos dois estados (sobre a foto e sobre fundo sólido) e, se quiser, um JS mínimo próprio (ex: menu mobile). Não carregue nenhuma outra biblioteca além de ícones (instrução de ÍCONES acima).
- DESIGN SYSTEM E REFERÊNCIAS: use a qualidade de composição e microinterações de 21st.dev como inspiração de acabamento, sem importar componentes React. Trate styles.refero.design, inspora.design e Framer Marketplace como repertório de paleta, tipografia, espaçamento e composição. Use a URL de referência do usuário quando fornecida, sem copiar marcas ou layouts. Crie sempre um layout específico e não-template.
- em TODO lugar onde uma foto for usada, use exatamente <img src="[[IMG:id_da_imagem]]" ...> com o id correspondente que você definiu na seção ===IMAGES===. Não use nenhuma outra URL de imagem, nunca use placeholder.com, unsplash ou picsum.
- todo o texto (títulos, menus, botões, seção de prova e rodapé) deve estar em português do Brasil e ser conteúdo real e específico do negócio informado, nunca "lorem ipsum", dados fabricados ou texto genérico como "Título aqui"
- o site deve ter uma única página (one-page). O menu deve conter âncoras apenas para destinos que existam e que ajudem a navegação; não crie itens para seções inexistentes.
- LARGURA TOTAL OBRIGATÓRIA: o documento deve ocupar 100% da largura da viewport em desktop e mobile. Defina html e body com width: 100%, min-width: 0 e margin: 0; não aplique max-width, width fixa, margem horizontal automática ou padding externo ao body, main, ao hero ou ao wrapper raiz da página. O hero, fundos de seção e imagens de faixa devem ir de uma borda à outra da viewport (width: 100% ou 100vw). Somente blocos internos de leitura, como classes container/content, podem ter max-width e margin auto. Antes de responder, confirme que não haverá faixas vazias nas laterais em telas largas.
 - CHECKLIST OBRIGATÓRIO ANTES DE RESPONDER: entregue o HTML inteiro e fechado; mantenha o header e o hero como contrato fixo e construa as demais seções que a história desta empresa pede. Contato/conversão: exiba telefone/WhatsApp e cidade somente quando existirem (tel:+55... e https://wa.me/55... com mensagem pré-preenchida natural, só com contato real); sem contato, CTA de âncora para formulário local honesto com feedback local. Avaliações: nota real sem inflar, nunca depoimento inventado. Localização: endereço legível + "Ver localização" só com dado real. Confira ainda: parece site de designer ou template de IA? hero impressiona em 3 segundos? proposta e ação claras em 5 segundos? identidade própria do segmento (não repetir fórmulas)? títulos serifados + corpo sans? paleta do segmento em variáveis? imagens coerentes com o negócio? CTAs com verbo específico? sem emoji-ícone, área vazia, placeholder ou dado inventado? contraste corpo ≥4.5:1, ::selection e focus-visible na paleta? Se falhar, refaça.
- ESTRUTURA VERIFICÁVEL: use uma tag section real com id="hero" como primeira seção. Crie as demais tags section quando sua função for necessária, com ids semânticos e únicos. Não esconda conteúdo essencial com display:none, opacity:0, height:0, overflow:hidden ou posicionamento fora da tela. O footer pode vir depois da última seção.
- IMAGENS: não deixe nenhuma área reservada vazia. Para cada placeholder [[IMG:id]] usado no HTML, declare exatamente um id correspondente em ===IMAGES===; não declare imagens que não sejam usadas. Gere entre 3 e 6 imagens, incluindo hero, apenas quando elas sustentarem a composição escolhida. A imagem principal do hero deve ser uma tag real <img class="hero-media" src="[[IMG:hero]]" alt="...">, posicionada absolutamente atrás do conteúdo com width: 100%, height: 100% e object-fit: cover. Nunca use [[IMG:hero]] em background-image, background ou url(...), nem coloque uma imagem base64 no CSS. A sobreposição escura do hero deve ser um pseudo-elemento ou elemento separado sobre a .hero-media, com opacidade máxima de 0.58; o conteúdo precisa ter z-index maior. Mantenha o HTML conciso o suficiente para terminar integralmente dentro do limite de resposta.
 - ÍCONES VISÍVEIS: todo elemento i com atributo data-lucide precisa estar dentro de um botão, link ou bloco de conteúdo com texto; não crie quadrados vazios, placeholders de ícone ou elementos decorativos sem ícone renderizável.
 - TIPOGRAFIA: títulos/display em fonte serifada editorial, corpo/navegação/botões em sans; confira que os dois @imports existem e que nenhum texto de título usa sans genérica sem intenção.
 `;

export function buildUserPrompt(d: BusinessFormData, referenceUrl: string, lead?: Lead | null): string {
  const googleBlock = lead
    ? `
DADOS DO GOOGLE (fatos — use exatamente como estão; o que estiver ausente NÃO existe: nunca invente, nunca preencha com algo plausível):
Categoria: ${lead.niche || '(não informada)'}
Telefone: ${lead.phone || '(não informado)'}
Endereço: ${lead.address || '(não informado)'}
Cidade/UF: ${[lead.city, lead.state].filter(Boolean).join('/') || '(não informada)'}
Avaliação no Google: ${lead.rating !== null && lead.rating !== undefined ? `${lead.rating.toFixed(1)}/5 em ${lead.reviewCount} avaliações` : '(não informada — não mostre nota nem depoimentos)'}; PROIBIDO transformar poucas avaliações em "centenas de clientes" ou criar depoimentos.
Site existente: ${lead.websiteUrl || '(não informado)'}
Link do Google Maps: ${lead.googleMapsUri || '(não informado — só crie botão "Ver localização" se houver endereço ou link real)'}
`
    : '';

  return `
Crie uma landing page one-page premium para o negócio abaixo. Siga o fluxo: DADOS → ENTENDER O NEGÓCIO → DIREÇÃO DE ARTE → PALETA → TIPOGRAFIA → COPY → IMAGENS → ARQUITETURA → HTML/CSS → INTERAÇÕES → REVISÃO → ENTREGA. Nunca apenas preencha um template.

Nome da empresa/marca: ${d.name}
Ramo de atuação: ${d.niche}
Descrição do negócio: ${d.desc || '(não informado, deduza com bom senso a partir do ramo — sem inventar fatos)'}
Diferenciais / provas a destacar: ${d.perks || '(não informado: descreva serviços e diferenciais sem alegações factuais não verificadas)'}
Texto desejado para o botão principal (CTA): ${d.cta || '(escolha o mais adequado ao ramo: solicitar orçamento, agendar, reservar, chamar no WhatsApp...)'}
WhatsApp/telefone de contato: ${d.phone || '(não informado: não invente; use formulário local honesto)'}
Cidade/região: ${d.city || '(não informado)'}
Preferência de paleta de cores: ${d.colors || '(crie a paleta do segmento em variáveis CSS)'}
${googleBlock}Referência visual enviada pelo usuário (use apenas como inspiração, sem copiar marca, layout ou textos): ${referenceUrl || 'Nenhuma'}

Crie a identidade do zero para ESTA empresa: hero cinematográfico de 80–100vh, arquitetura livre após o hero, copy com voz humana e específica, zero dado inventado. Proibido repetir fórmulas (hero centralizado genérico; texto à esquerda + foto à direita; gradiente azul/roxo; cards idênticos; fonte padrão; manchete pequena; depoimento genérico).

${OUTPUT_FORMAT}
`;
}

export function parseModelOutput(raw: string): ParsedSite {
  const imgMatch = raw.split('===IMAGES===')[1]?.split('===HTML===')[0];
  const htmlMatch = raw.split('===HTML===')[1];
  if (!imgMatch || !htmlMatch) {
    throw new Error('Não consegui interpretar a resposta do modelo (formato inesperado). Tente gerar novamente.');
  }
  const images = imgMatch
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      return {
        id: line.slice(0, idx).trim().replace(/^[-*\d.\s]+/, ''),
        prompt: line.slice(idx + 1).trim(),
      };
    })
    .filter((v): v is { id: string; prompt: string } => v !== null);

  let html = htmlMatch.trim();
  html = html.replace(/^```(html)?/i, '').replace(/```$/, '').trim();

  return { images, html };
}

export interface SiteValidation {
  blocking: string[];
  warnings: string[];
}

// Repara automaticamente divergências entre ===IMAGES=== e ===HTML=== para
// que um HTML completo nunca seja descartado por causa do inventário:
// - declaração não utilizada no HTML é removida da lista (nunca seria gerada);
// - placeholder usado no HTML sem declaração ganha uma entrada genérica, para
//   não virar caixa "Imagem indisponível" no site final;
// - ids duplicados são unificados (vale a primeira ocorrência).
// O hero continua obrigatório e segue validado como bloqueante.
export function sanitizeGeneratedSite(site: ParsedSite): { site: ParsedSite; fixed: string[] } {
  const fixed: string[] = [];
  const usedIds = new Set<string>();
  const placeholderRe = /\[\[IMG:([a-zA-Z0-9_]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = placeholderRe.exec(site.html)) !== null) usedIds.add(m[1]);

  const seen = new Set<string>();
  const images: ParsedSite['images'] = [];
  for (const img of site.images) {
    if (seen.has(img.id)) {
      fixed.push(`imagem duplicada "${img.id}" removida`);
      continue;
    }
    seen.add(img.id);
    if (!usedIds.has(img.id)) {
      fixed.push(`imagem "${img.id}" declarada mas não usada no HTML — removida`);
      continue;
    }
    images.push(img);
  }
  for (const id of usedIds) {
    if (!seen.has(id)) {
      images.push({
        id,
        prompt: `commercial advertising photograph, shot on a full-frame camera, natural depth of field, premium editorial composition matching the surrounding website section, realistic materials and lighting. absolutely no text, letters, numbers, logo, signage, labels, watermark, typography or brand mark; all surfaces blank`,
      });
      fixed.push(`imagem "${id}" usada no HTML mas não declarada — entrada criada`);
    }
  }
  return { site: { images, html: site.html }, fixed };
}

export function validateGeneratedSite(site: ParsedSite): SiteValidation {
  const { images, html } = site;
  const normalized = html.toLowerCase();
  const blocking: string[] = [];
  const warnings: string[] = [];
  const requiredSections = ['hero'];
  const requiredImages = ['hero'];

  if (!/^<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) blocking.push('o documento HTML não está completo');
  if (!/<body[\s>]/i.test(html)) blocking.push('a tag body está ausente');
  if (html.length < 7000) blocking.push('o HTML está curto demais para um site completo');
  if (/lorem ipsum|seu texto aqui|t[íi]tulo aqui|imagem aqui/i.test(html)) {
    blocking.push('o HTML contém texto placeholder (lorem ipsum ou similar)');
  }

  for (const id of requiredSections) {
    const sectionPattern = new RegExp(`<section[^>]*\\bid=["']${id}["']`, 'i');
    if (!sectionPattern.test(html)) blocking.push(`a seção #${id} está ausente`);
  }

  const suppliedImageIds = images.map((image) => image.id);
  for (const id of requiredImages) {
    if (!suppliedImageIds.includes(id)) blocking.push(`a imagem ${id} não foi declarada`);
    if (!html.includes(`[[IMG:${id}]]`)) blocking.push(`a imagem ${id} não foi usada no HTML`);
  }
  // Divergências de inventário (declarada-sem-uso, usada-sem-declaração,
  // duplicadas, total fora de 3-6) são reparadas automaticamente por
  // sanitizeGeneratedSite antes desta validação — aqui viram só aviso para
  // nunca descartar um HTML completo por causa delas.
  if (images.length < 3 || images.length > 6) {
    warnings.push(`o ideal são 3 a 6 imagens (atual: ${images.length})`);
  }
  if (new Set(suppliedImageIds).size !== suppliedImageIds.length) {
    warnings.push('a lista de imagens contém ids duplicados');
  }
  for (const id of suppliedImageIds) {
    if (!html.includes(`[[IMG:${id}]]`)) warnings.push(`a imagem ${id} foi declarada, mas não foi usada no HTML`);
  }
  const usedPlaceholderRe = /\[\[IMG:([a-zA-Z0-9_]+)\]\]/g;
  let usedMatch: RegExpExecArray | null;
  while ((usedMatch = usedPlaceholderRe.exec(html)) !== null) {
    if (!suppliedImageIds.includes(usedMatch[1])) warnings.push(`a imagem ${usedMatch[1]} é usada no HTML, mas não foi declarada`);
  }

  const hasDirectContact = /(tel:|https:\/\/wa\.me\/)/i.test(html);
  if (!hasDirectContact && !/<form[\s>]/i.test(html)) {
    blocking.push('o site precisa oferecer contato real (link tel:/wa.me) ou formulário local funcional');
  }
  const heroImageElement = /<img\b(?=[^>]*\bsrc=["']\[\[IMG:hero\]\]["'])(?=[^>]*\bclass=["'][^"']*\bhero-media\b)/i;
  if (!heroImageElement.test(html)) {
    blocking.push('a imagem do hero deve ser uma tag img.hero-media');
  }
  if (/background(?:-image)?\s*:[^;{}]*\[\[IMG:hero\]\]/i.test(html) || /url\(\s*["']?\[\[IMG:hero\]\]/i.test(html)) {
    blocking.push('a imagem do hero não pode ser usada como background CSS');
  }
  if (!/\.hero-media\s*\{[^}]*\bobject-fit\s*:\s*cover/i.test(html)) {
    blocking.push('a imagem do hero precisa usar object-fit: cover');
  }

  if (!/data-lucide=/i.test(html) || !/lucide\.createicons\(\)/i.test(normalized)) {
    warnings.push('os ícones Lucide não foram inicializados');
  }
  if (!/lenis@1\.3\.26\/dist\/lenis\.min\.js/i.test(html) || !/new\s+lenis\s*\(/i.test(html) || !/autoraf\s*:\s*true/i.test(html)) {
    warnings.push('o scroll suave Lenis não foi configurado');
  }
  if (!/is-scrolled/i.test(html) || !/addEventListener\(['"]scroll['"]/i.test(html) || !/window\.scrollY/i.test(html)) {
    warnings.push('o header não possui comportamento sólido após a rolagem');
  }
  if (!/gsap@3\.15\.0\/dist\/gsap\.min\.js/i.test(html) || !/scrolltrigger\.min\.js/i.test(html) || !/registerplugin\s*\(\s*scrolltrigger\s*\)/i.test(html)) {
    warnings.push('as animações GSAP com ScrollTrigger não foram configuradas');
  }

  return { blocking, warnings };
}

function insertBeforeCloseTag(html: string, tag: string, snippet: string): string {
  const idx = html.toLowerCase().lastIndexOf(tag);
  if (idx === -1) return html + snippet;
  return html.slice(0, idx) + snippet + html.slice(idx);
}

// Completa localmente (sem nova chamada ao modelo) os itens de warning:
// scripts/init de Lucide, Lenis, GSAP e header sólido.
export function repairHtmlSite(source: string): { html: string; fixed: string[] } {
  let html = source;
  const fixed: string[] = [];

  const hasLucideScript = /unpkg\.com\/lucide/i.test(html);
  const hasLucideInit = /lucide\.createicons\(\)/i.test(html);
  const hasLenis = /lenis@1\.3\.26\/dist\/lenis\.min\.js/i.test(html) && /new\s+lenis\s*\(/i.test(html);
  const hasHeader = /is-scrolled/i.test(html) && /window\.scrollY/i.test(html);
  const hasGsap =
    /gsap@3\.15\.0\/dist\/gsap\.min\.js/i.test(html) && /registerplugin\s*\(\s*scrolltrigger\s*\)/i.test(html);

  if (!/lenis@1\.3\.26\/dist\/lenis\.css/i.test(html)) {
    html = insertBeforeCloseTag(html, '</head>', '<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">');
  }
  if (!hasHeader) {
    html = insertBeforeCloseTag(html, '</head>', '<style>header.is-scrolled{box-shadow:0 10px 30px rgba(0,0,0,.12);}</style>');
  }

  let bodyScripts = '';
  if (!hasLucideScript) {
    bodyScripts += '<script src="https://unpkg.com/lucide@latest"></script>';
    fixed.push('script Lucide');
  }
  if (!hasLenis) {
    bodyScripts +=
      '<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>' +
      '<script>if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&window.Lenis){var __lenis=new Lenis({autoRaf:true,anchors:true,smoothWheel:true});}</script>';
    fixed.push('scroll suave Lenis');
  }
  if (!hasGsap) {
    bodyScripts +=
      '<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>' +
      '<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>' +
      '<script>if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);gsap.utils.toArray("section").forEach(function(s){gsap.from(s,{opacity:0,y:24,duration:.7,ease:"power2.out",scrollTrigger:{trigger:s,start:"top 88%"}});});}</script>';
    fixed.push('animações GSAP');
  }
  if (!hasHeader) {
    bodyScripts +=
      '<script>(function(){function h(){var e=document.querySelector("header");if(e)e.classList.toggle("is-scrolled",window.scrollY>80);}addEventListener("scroll",h,{passive:true});h();})();</script>';
    fixed.push('header sólido após scroll');
  }
  if (bodyScripts) html = insertBeforeCloseTag(html, '</body>', bodyScripts);
  if (!hasLucideInit) {
    html = insertBeforeCloseTag(html, '</body>', '<script>if(window.lucide)lucide.createIcons();</script>');
    fixed.push('inicialização de ícones');
  }

  return { html, fixed };
}

export const FALLBACK_IMAGE_SVG =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="34">Imagem indisponível</text></svg>'
  );

// Placeholder exibido no preview enquanto a foto real ainda está sendo gerada.
export const LOADING_IMAGE_SVG =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#e8ebf0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9aa0ab" font-family="Arial" font-size="36">Gerando imagem…<animate attributeName="opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite"/></text></svg>'
  );
