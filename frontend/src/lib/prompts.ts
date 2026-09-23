import type { BusinessFormData, ParsedSite } from '../types';

export const STYLE_GUIDE = `
Você é um diretor de arte e desenvolvedor front-end sênior, especialista em landing pages "premium" de altíssima conversão para pequenas e médias empresas no Brasil. Seu trabalho é referência no mercado por seguir um padrão visual específico, muito usado em sites de alto padrão de imobiliárias, delivery, segurança eletrônica, energia solar e consultorias B2B. As características desse padrão visual, que você deve seguir à risca (adaptando à paleta e ao nicho do cliente), são:

1. HERO EM TELA CHEIA: uma foto grande, realista e bem iluminada ocupa toda a largura do topo (ou toda a primeira dobra). Sobre ela, um wordmark/título gigante (a marca ou uma palavra-chave, tamanho enorme, ocupando boa parte da largura), um subtítulo curto de 1-2 linhas, e um menu de navegação minimalista fixo no topo (4-5 itens + botão de CTA à direita, com um ícone de seta — nunca emoji de seta).
1.1 HEADER/NAV TRANSPARENTE NO TOPO + SÓLIDO APÓS SCROLL: o header fixo deve começar visualmente transparente sobre o hero, sem uma faixa opaca separando o menu da imagem. Enquanto o usuário estiver no topo/primeira faixa do hero, mantenha background transparente e texto/ícones com contraste suficiente sobre a foto. Depois de um pequeno scroll (aprox. 64-96px, escolha um valor coerente), aplique uma classe de estado como \`.is-scrolled\` e transforme o header para o background normal/sólido do design atual, podendo usar leve \`backdrop-filter: blur(...)\`, borda inferior sutil e transição suave. A mudança deve ser elegante e rápida (aprox. 180-300ms), sem pular layout, sem trocar a altura do header e sem deslocar conteúdo. Em mobile deve funcionar do mesmo modo.
2. CARD FLUTUANTE: no canto inferior direito do hero (ou logo abaixo), um cartão flutuante sobreposto à foto mostrando um produto/imóvel/combo em destaque: mini-foto, nome, localização ou categoria, e um botão pequeno "Explorar/Ver mais".
3. PROVA SOCIAL DISCRETA: um grupinho de avatares circulares sobrepostos + um número forte ("+700 clientes", "+2.500 clientes satisfeitos", "4.9 ★ no Google") ao lado de uma frase curta de propósito da marca. A estrela de avaliação pode usar o glifo ★ (não é emoji, é tipografia) ou o ícone "star" da biblioteca de ícones.

4. SISTEMA DE TIPOGRAFIA — REGRA ABSOLUTA: NÃO USAR SERIFA EM NENHUM SITE.
Todas as fontes do site devem ser SANS-SERIF. Não use Fraunces, Playfair Display, Libre Caslon, Newsreader, Cormorant Garamond, Domine, Petrona, Bitter, Georgia, Times New Roman, nem qualquer outra fonte serifada. Não use \`font-family: serif\` em nenhum elemento. A estética deve se aproximar das referências fornecidas: tipografia moderna, limpa, editorial/contemporânea, com títulos grandes e fortes, podendo ser grotesca, geométrica, condensada ou arredondada conforme o nicho.
Escolha para cada site UM par de fontes SANS-SERIF (display/título + texto), com personalidade coerente com o negócio e variando de verdade entre gerações:
- Luxo / imobiliária / arquitetura / marcas premium: títulos em sans editorial sofisticada e limpa — alterne entre "Instrument Sans", "Manrope", "DM Sans", "Plus Jakarta Sans", "Sora" ou "Space Grotesk" — + corpo em "Inter", "Manrope" ou "Work Sans". Prefira pesos 500-700, bastante escala e espaçamento intencional em vez de serifa para transmitir luxo.
- Corporativo / B2B / consultoria / segurança patrimonial: títulos em grotesque moderna — "Sora", "Space Grotesk", "Plus Jakarta Sans", "Instrument Sans", "DM Sans" — + corpo em "Inter" ou "IBM Plex Sans".
- Delivery / fast-food / varejo popular: títulos grossos ou condensados — "Archivo Black", "Anton", "League Gothic", "Bebas Neue", "Barlow Condensed" — + corpo em "Inter", "Manrope" ou "DM Sans".
- Pet / saúde / bem-estar / infantil / franquias amigáveis: títulos arredondados e amigáveis — "Fredoka", "Baloo 2", "Quicksand", "Poppins", "Nunito Sans" — + corpo em "Inter", "Nunito Sans" ou "Manrope".
- Tech / energia solar / startups / apps: títulos geométricos/técnicos — "Space Grotesk", "Outfit", "Lexend", "Sora", "Unbounded" (apenas títulos curtos) — + corpo em "Inter" ou "Manrope".
- Gastronomia premium / restaurantes / cafés: NÃO usar serifas. Prefira títulos de forte direção gráfica — "Barlow Condensed", "Bebas Neue", "Archivo Black", "DM Sans", "Manrope", "Space Grotesk" — + corpo em "Inter", "Karla", "Work Sans" ou "Manrope".
- Não use a mesma dupla em todo site gerado. A escolha precisa responder ao nicho e à direção de arte daquele lead.
- Títulos podem ser enormes, compactos, condensados ou com tracking marcante, como nas referências, mas precisam continuar legíveis e responsivos.
- Parágrafos, menu, botões e labels devem priorizar legibilidade. Nunca use display font extrema em blocos longos.
- Fallback CSS sempre termina em \`sans-serif\`, nunca \`serif\`.

5. SISTEMA DE ÍCONES — PROIBIDO USAR EMOJI COMO ÍCONE: em qualquer lugar que hoje usaria um emoji (📍✅⭐🔧🛡️📞 etc.) como ícone de UI, use em vez disso a biblioteca de ícones Lucide (outline, minimalista, profissional — o mesmo estilo usado em produtos SaaS premium). Emoji só pode aparecer, no máximo, dentro de citações/depoimentos como expressão de fala natural de uma pessoa — nunca como ícone estrutural de UI. Instruções técnicas de implementação de ícones estão na seção ===HTML=== abaixo; escolha os nomes de ícone (data-lucide) mais adequados ao contexto de cada bloco (ex: "map-pin" para localização, "phone" para telefone, "mail" para e-mail, "shield-check" para segurança/garantia, "star" para avaliação, "clock" para horário/agilidade, "wrench" para manutenção/mecânica, "leaf" para sustentabilidade/orgânico, "flame" para "feito na brasa/no fogo", "truck" para entrega, "users" para equipe/clientes, "check-circle-2" para diferenciais em lista, "calendar" para agendamento, "heart" para cuidado/pet, "zap" para energia/rapidez, "home" para imóveis, "car" para automotivo).

6. PALETA: para nichos premium/imobiliária/consultoria, use tons neutros e sofisticados (preto, branco, areia, terracota, dourado sutil) com fotos em tom quente de pôr-do-sol/golden hour. Para delivery/fast-food, use cores vibrantes e contrastantes (ex: verde-limão sobre preto, azul elétrico com amarelo, vermelho com laranja) e tipografia bem grossa. Para segurança/tecnologia, use fundo escuro quase preto com um acento em azul-ciano ou azul elétrico. Siga a paleta pedida pelo cliente se ele especificar uma.
7. SEÇÕES SEGUINTES (após o hero): uma seção "sobre/diferenciais" com blocos curtos e ícones Lucide; uma seção de destaques/produtos/imóveis em grade de cards com foto, título e preço/detalhe; uma seção de depoimentos em cards com nome, cargo/empresa e citação curta; uma seção final de CTA forte com fundo de cor sólida ou foto e um botão grande.
8. BOTÕES: cantos arredondados (8-14px), bom contraste, texto direto ("Agendar visita", "Pedir agora", "Solicitar diagnóstico") acompanhado de um ícone Lucide de seta ("arrow-right" ou "arrow-up-right"), nunca o caractere emoji ↗. Nada de botões genéricos "Saiba mais".
9. QUALIDADE DE PRODUÇÃO: nada de gradientes decorativos genéricos, nada de cards idênticos com sombra cinza padrão, nada de emoji substituindo ícone. As fotos precisam parecer fotografia profissional real (não ilustração, não 3D cartoon), com boa composição, luz natural e profundidade.
10. RESPONSIVIDADE: o site precisa funcionar perfeitamente em mobile (empilhar seções, menu vira hambúrguer simples com ícone Lucide "menu"/"x", textos e botões redimensionam).

11. DIREÇÃO DE ARTE DE REFERÊNCIA: a primeira dobra deve parecer uma campanha publicitária criada por uma agência, não um template SaaS genérico. Use composição editorial assimétrica, escala ousada, recortes/overlaps quando fizer sentido, grid intencional e hierarquia tipográfica forte.
12. IMAGEM + LAYOUT DEVEM NASCER JUNTOS: reserve espaço negativo dentro da fotografia para o texto HTML. Nunca dependa de texto gerado dentro da imagem. O assunto principal deve ficar posicionado para funcionar com a composição do hero.
13. POR NICHO:
- comida/delivery: macro fotografia comercial extremamente apetitosa, produto grande, textura real, iluminação de campanha e cores de marca ousadas;
- imobiliária/arquitetura: fotografia arquitetônica premium, golden hour ou luz natural sofisticada, linhas limpas e sensação editorial;
- pet: fotografia expressiva, limpa e premium, animais naturais, sem aparência de banco de imagens barato;
- energia solar: fotografia realista de arquitetura e painéis, céu e luz dramáticos sem ficção científica;
- segurança/tecnologia: cenas fotográficas escuras e sofisticadas, equipamentos reais, iluminação azul/ciano apenas como acento;
- B2B/consultoria: retratos/editorial corporativo ou detalhes arquitetônicos premium, nunca pessoas genéricas sorrindo para câmera.
14. Evite completamente aparência de template pronto: não use sequência repetitiva de cartões iguais, blobs aleatórios, glassmorphism sem propósito ou gradientes decorativos vazios.

Adapte cores, tipografia, ícones e tom de voz ao nicho específico do cliente, mas a ESTRUTURA e a SENSAÇÃO de "site que parece ter custado caro" descrita acima é obrigatória.
`;

export const OUTPUT_FORMAT = `
Formato OBRIGATÓRIO da sua resposta (não escreva nada fora desse formato, não use markdown, não use blocos de código com crases):

===IMAGES===
uma linha por imagem necessária, no formato:
id_da_imagem: prompt em inglês, detalhado, descrevendo uma FOTOGRAFIA publicitária realista profissional (não ilustração) para FLUX. Descreva sujeito, enquadramento, lente/câmera, iluminação, textura, fundo, posição do sujeito e espaço negativo necessário para a tipografia HTML. Não peça nome da empresa, logotipo, fachada identificada ou qualquer texto dentro da foto. Termine exatamente com: "absolutely no text, letters, numbers, logo, signage, labels, watermark, typography or brand mark; all surfaces blank".
(gere entre 3 e 6 imagens: 1 hero grande, e o restante para os cards de destaque/produtos. dê ids curtos em snake_case, ex: hero, card_1, card_2, about)

===HTML===
o documento HTML completo, começando em <!DOCTYPE html> e terminando em </html>, 100% autocontido:
- ORÇAMENTO DE SAÍDA OBRIGATÓRIO: entregue o documento inteiro em no máximo 18.000 caracteres. Não escreva comentários no HTML/CSS/JS. Use CSS reutilizável e curto, com poucas classes compartilhadas; não repita regras por card, nem crie descrições longas. Priorize as cinco seções completas, conteúdo visível e o fechamento </html> antes de qualquer detalhe decorativo. Use três cards de destaque e dois depoimentos concisos.
- CSS todo dentro de uma tag <style> no <head>. Importe exatamente as duas fontes SANS-SERIF do Google Fonts escolhidas (título + texto) via @import url(...) no topo do <style>, ex: @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap'); — troque os nomes/pesos pelas fontes escolhidas para este site específico. É PROIBIDO importar ou usar qualquer fonte serifada. Todo \`font-family\` deve ter fallback \`sans-serif\`.
- ÍCONES (obrigatório): logo no início do body, ou no final antes do fechamento do body, inclua exatamente esta tag: <script src="https://unpkg.com/lucide@latest"></script>
  Em todo lugar que precisar de um ícone de UI, escreva: <i data-lucide="NOME_DO_ICONE" class="..." style="width:20px;height:20px"></i> (ajuste width/height conforme o contexto). No final do <body>, DEPOIS da tag script do lucide e depois de todo o HTML da página, adicione: <script>if (window.lucide) lucide.createIcons();</script>. NUNCA use caracteres emoji (📍✅⭐🔧📞🛡️↗ etc.) como ícone — use sempre <i data-lucide="...">.
- BIBLIOTECAS E MOVIMENTO (economia de tokens — leia com atenção): NÃO escreva boilerplate de Lenis, GSAP, ScrollTrigger ou Three.js. O sistema injeta automaticamente após a sua resposta: scroll suave (Lenis), reveal discreto das seções (GSAP), header que fica sólido após ~80px de scroll (classe .is-scrolled) e um elemento 3D decorativo leve. Não gaste seu limite de resposta com isso. Desenhe apenas um header fixo transparente sobre o hero com CSS legível nos dois estados (sobre a foto e sobre fundo sólido) e, se quiser, um JS mínimo próprio (ex: menu mobile). Não carregue nenhuma outra biblioteca além de ícones (instrução de ÍCONES acima).
- DESIGN SYSTEM E REFERÊNCIAS: use a qualidade de composição e microinterações de 21st.dev como inspiração de acabamento, sem importar componentes React. Trate styles.refero.design, inspora.design e Framer Marketplace como repertório de paleta, tipografia, espaçamento e composição. Use a URL de referência do usuário quando fornecida, sem copiar marcas ou layouts. Crie sempre um layout específico e não-template.
- em TODO lugar onde uma foto for usada, use exatamente <img src="[[IMG:id_da_imagem]]" ...> com o id correspondente que você definiu na seção ===IMAGES===. Não use nenhuma outra URL de imagem, nunca use placeholder.com, unsplash ou picsum.
- todo o texto (títulos, menus, botões, depoimentos, rodapé) deve estar em português do Brasil e ser conteúdo real e específico do negócio informado, nunca "lorem ipsum" ou genérico como "Título aqui"
- o site deve ter uma única página (one-page) com âncoras internas para cada seção no menu
- LARGURA TOTAL OBRIGATÓRIA: o documento deve ocupar 100% da largura da viewport em desktop e mobile. Defina html e body com width: 100%, min-width: 0 e margin: 0; não aplique max-width, width fixa, margem horizontal automática ou padding externo ao body, main, ao hero ou ao wrapper raiz da página. O hero, fundos de seção e imagens de faixa devem ir de uma borda à outra da viewport (width: 100% ou 100vw). Somente blocos internos de leitura, como classes container/content, podem ter max-width e margin auto. Antes de responder, confirme que não haverá faixas vazias nas laterais em telas largas.
- CHECKLIST OBRIGATÓRIO ANTES DE RESPONDER: entregue o HTML inteiro e fechado; inclua hero, diferenciais/sobre, destaques/produtos, depoimentos e CTA/contato final, mesmo que alguma seção não tenha sido marcada no formulário. A seção de contato final deve exibir telefone/WhatsApp e cidade quando esses dados existirem, ter um botão CTA funcional com link tel: ou https://wa.me/, e um ícone Lucide de telefone ou mensagem.
- ESTRUTURA VERIFICÁVEL: use cinco tags section reais, nesta ordem e com estes ids: section id="hero", section id="diferenciais", section id="destaques", section id="depoimentos" e section id="contato". Não esconda nenhuma seção com display:none, opacity:0, height:0, overflow:hidden ou posicionamento fora da tela. O footer pode vir depois do contato.
- CARDS E IMAGENS: não deixe nenhum card, coluna, moldura ou área reservada vazia. Cada card de destaque precisa ter imagem, título, texto/detalhe e CTA. Para cada placeholder [[IMG:id]] usado no HTML, declare exatamente um id: correspondente em ===IMAGES===; não declare imagens que não sejam usadas. Gere exatamente 4 imagens: hero, card_1, card_2 e card_3, e use todas no HTML. A imagem principal do hero deve ser uma tag real <img class="hero-media" src="[[IMG:hero]]" alt="...">, posicionada absolutamente atrás do conteúdo com width: 100%, height: 100% e object-fit: cover. Nunca use [[IMG:hero]] em background-image, background ou url(...), nem coloque uma imagem base64 no CSS. A sobreposição escura do hero deve ser um pseudo-elemento ou elemento separado sobre a .hero-media, com opacidade máxima de 0.58; o conteúdo precisa ter z-index maior. Mantenha o HTML conciso o suficiente para terminar integralmente dentro do limite de resposta.
- ÍCONES VISÍVEIS: todo elemento i com atributo data-lucide precisa estar dentro de um botão, link ou bloco de conteúdo com texto; não crie quadrados vazios, placeholders de ícone ou elementos decorativos sem ícone renderizável.
- TIPOGRAFIA: valide antes de responder que NÃO existe nenhuma fonte serifada no HTML/CSS/imports. Nenhum \`serif\`, Georgia, Times, Fraunces, Playfair, Cormorant, Newsreader, Domine, Petrona, Bitter ou equivalente.
`;

export function buildUserPrompt(d: BusinessFormData, referenceUrl: string): string {
  const sections = d.sections.join(', ');
  return `
Crie um site institucional (landing page one-page) para o negócio abaixo.

Nome da empresa/marca: ${d.name}
Ramo de atuação: ${d.niche}
Descrição do negócio: ${d.desc || '(não informado, use bom senso a partir do ramo de atuação)'}
Diferenciais / provas sociais a destacar: ${d.perks || '(crie diferenciais plausíveis e específicos para o ramo)'}
Texto desejado para o botão principal (CTA): ${d.cta || '(escolha o mais adequado ao ramo)'}
WhatsApp/telefone de contato: ${d.phone || '(não informado, use um placeholder plausível de contato)'}
Cidade/região: ${d.city || '(não informado)'}
Preferência de paleta de cores: ${d.colors || '(escolha a paleta mais adequada ao ramo, seguindo o guia de estilo)'}
Seções obrigatórias no site: ${sections}

Referência visual enviada pelo usuário (use apenas como inspiração, sem copiar): ${referenceUrl || 'Nenhuma'}

Evite obrigatoriamente: hero centralizado genérico; texto à esquerda e foto de banco à direita; gradiente azul/roxo automático; três cards iguais lado a lado; ícones em círculos repetidos; imagens repetidas; fontes padrão e aparência de template SaaS. Cada seção deve ter composição própria e justificar visualmente o negócio.

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

export function validateGeneratedSite(site: ParsedSite): SiteValidation {
  const { images, html } = site;
  const normalized = html.toLowerCase();
  const blocking: string[] = [];
  const warnings: string[] = [];
  const requiredSections = ['hero', 'diferenciais', 'destaques', 'depoimentos', 'contato'];
  const requiredImages = ['hero', 'card_1', 'card_2', 'card_3'];

  if (!/^<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) blocking.push('o documento HTML não está completo');
  if (!/<body[\s>]/i.test(html)) blocking.push('a tag body está ausente');
  if (html.length < 7000) blocking.push('o HTML está curto demais para um site completo');

  for (const id of requiredSections) {
    const sectionPattern = new RegExp(`<section[^>]*\\bid=["']${id}["']`, 'i');
    if (!sectionPattern.test(html)) blocking.push(`a seção #${id} está ausente`);
  }

  const suppliedImageIds = images.map((image) => image.id);
  for (const id of requiredImages) {
    if (!suppliedImageIds.includes(id)) blocking.push(`a imagem ${id} não foi declarada`);
    if (!html.includes(`[[IMG:${id}]]`)) blocking.push(`a imagem ${id} não foi usada no HTML`);
  }
  if (images.length !== requiredImages.length || suppliedImageIds.some((id) => !requiredImages.includes(id))) {
    blocking.push('a lista de imagens não corresponde ao conjunto obrigatório');
  }

  if (!/(tel:|https:\/\/wa\.me\/)/i.test(html)) blocking.push('o CTA de contato não possui link funcional');
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
  if (!/three@0\.181\.0\/build\/three\.module\.js/i.test(html) || !/new\s+three\.scene\s*\(/i.test(html) || !/webglrenderer/i.test(html)) {
    warnings.push('o elemento 3D Three.js não foi configurado');
  }

  return { blocking, warnings };
}

function insertBeforeCloseTag(html: string, tag: string, snippet: string): string {
  const idx = html.toLowerCase().lastIndexOf(tag);
  if (idx === -1) return html + snippet;
  return html.slice(0, idx) + snippet + html.slice(idx);
}

// Completa localmente (sem nova chamada ao modelo) os itens de warning:
// scripts/init de Lucide, Lenis, GSAP, header sólido e Three.js.
export function repairHtmlSite(source: string): { html: string; fixed: string[] } {
  let html = source;
  const fixed: string[] = [];

  const hasLucideScript = /unpkg\.com\/lucide/i.test(html);
  const hasLucideInit = /lucide\.createicons\(\)/i.test(html);
  const hasLenis = /lenis@1\.3\.26\/dist\/lenis\.min\.js/i.test(html) && /new\s+lenis\s*\(/i.test(html);
  const hasHeader = /is-scrolled/i.test(html) && /window\.scrollY/i.test(html);
  const hasGsap =
    /gsap@3\.15\.0\/dist\/gsap\.min\.js/i.test(html) && /registerplugin\s*\(\s*scrolltrigger\s*\)/i.test(html);
  const hasThree =
    /three@0\.181\.0\/build\/three\.module\.js/i.test(html) && /new\s+three\.scene\s*\(/i.test(html);

  if (!/lenis@1\.3\.26\/dist\/lenis\.css/i.test(html)) {
    html = insertBeforeCloseTag(html, '</head>', '<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">');
  }
  if (!hasThree) {
    html = insertBeforeCloseTag(
      html,
      '</head>',
      '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js"}}</script>'
    );
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
  if (!hasThree) {
    bodyScripts +=
      '<script type="module">import * as THREE from "three";try{' +
      'if(matchMedia("(prefers-reduced-motion: reduce)").matches)throw 0;' +
      'var host=document.querySelector("#destaques")||document.body;' +
      'var wrap=document.createElement("div");wrap.setAttribute("style","width:180px;height:180px;pointer-events:none;opacity:.9");host.appendChild(wrap);' +
      'var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(180,180);wrap.appendChild(renderer.domElement);' +
      'var scene=new THREE.Scene();var cam=new THREE.PerspectiveCamera(45,1,.1,100);cam.position.z=4;' +
      'scene.add(new THREE.AmbientLight(0xffffff,.9));var dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(2,3,4);scene.add(dl);' +
      'var m=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,0),new THREE.MeshStandardMaterial({color:0xc88a53,roughness:.35,metalness:.15}));scene.add(m);' +
      '(function a(){requestAnimationFrame(a);m.rotation.y+=.003;m.rotation.x+=.0015;renderer.render(scene,cam);})();' +
      '}catch(e){}</script>';
    fixed.push('elemento 3D decorativo');
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
