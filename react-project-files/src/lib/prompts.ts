import type { BusinessFormData, ParsedSite } from '../types';

export const STYLE_GUIDE = `
Você é um diretor de arte e desenvolvedor front-end sênior, especialista em landing pages "premium" de altíssima conversão para pequenas e médias empresas no Brasil. Seu trabalho é referência no mercado por seguir um padrão visual específico, muito usado em sites de alto padrão de imobiliárias, delivery, segurança eletrônica, energia solar e consultorias B2B. As características desse padrão visual, que você deve seguir à risca (adaptando à paleta e ao nicho do cliente), são:

1. HERO EM TELA CHEIA: uma foto grande, realista e bem iluminada ocupa toda a largura do topo (ou toda a primeira dobra). Sobre ela, um wordmark/título gigante (a marca ou uma palavra-chave, em fonte serifada ou sans bold, tamanho enorme, ocupando boa parte da largura), um subtítulo curto de 1-2 linhas, e um menu de navegação minimalista fixo no topo (4-5 itens + botão de CTA à direita, com ícone de seta ↗ ou →).
2. CARD FLUTUANTE: no canto inferior direito do hero (ou logo abaixo), um cartão flutuante sobreposto à foto mostrando um produto/imóvel/combo em destaque: mini-foto, nome, localização ou categoria, e um botão pequeno "Explorar/Ver mais".
3. PROVA SOCIAL DISCRETA: um grupinho de avatares circulares sobrepostos + um número forte ("+700 clientes", "+2.500 clientes satisfeitos", "4.9 ★ no Google") ao lado de uma frase curta de propósito da marca.
4. TIPOGRAFIA: fonte serifada elegante (estilo Fraunces/Playfair) para nichos premium (imobiliária, consultoria, segurança patrimonial) OU fonte sans bold extra-grossa e colorida para nichos de comida/delivery/varejo popular. Nunca as duas ao mesmo tempo.
5. PALETA: para nichos premium/imobiliária/consultoria, use tons neutros e sofisticados (preto, branco, areia, terracota, dourado sutil) com fotos em tom quente de pôr-do-sol/golden hour. Para delivery/fast-food, use cores vibrantes e contrastantes (ex: verde-limão sobre preto, azul elétrico com amarelo, vermelho com laranja) e tipografia bem grossa. Para segurança/tecnologia, use fundo escuro quase preto com um acento em azul-ciano ou azul elétrico. Siga a paleta pedida pelo cliente se ele especificar uma.
6. SEÇÕES SEGUINTES (após o hero): uma seção "sobre/diferenciais" com blocos curtos e ícones simples; uma seção de destaques/produtos/imóveis em grade de cards com foto, título e preço/detalhe; uma seção de depoimentos em cards com nome, cargo/empresa e citação curta; uma seção final de CTA forte com fundo de cor sólida ou foto e um botão grande.
7. BOTÕES: cantos arredondados (8-14px), bom contraste, texto direto ("Agendar visita ↗", "Pedir agora →", "Solicitar diagnóstico"). Nada de botões genéricos "Saiba mais".
8. QUALIDADE DE PRODUÇÃO: nada de gradientes decorativos genéricos, nada de cards idênticos com sombra cinza padrão, nada de emojis substituindo ícones. As fotos precisam parecer fotografia profissional real (não ilustração, não 3D cartoon), com boa composição, luz natural e profundidade.
9. RESPONSIVIDADE: o site precisa funcionar perfeitamente em mobile (empilhar seções, menu vira hambúrguer simples, textos e botões redimensionam).

10. DIREÇÃO DE ARTE DE REFERÊNCIA: a primeira dobra deve parecer uma campanha publicitária criada por uma agência, não um template SaaS genérico. Use composição editorial assimétrica, escala ousada, recortes/overlaps quando fizer sentido, grid intencional e hierarquia tipográfica forte.
11. IMAGEM + LAYOUT DEVEM NASCER JUNTOS: reserve espaço negativo dentro da fotografia para o texto HTML. Nunca dependa de texto gerado dentro da imagem. O assunto principal deve ficar posicionado para funcionar com a composição do hero.
12. POR NICHO:
- comida/delivery: macro fotografia comercial extremamente apetitosa, produto grande, textura real, iluminação de campanha e cores de marca ousadas;
- imobiliária/arquitetura: fotografia arquitetônica premium, golden hour ou luz natural sofisticada, linhas limpas e sensação editorial;
- pet: fotografia expressiva, limpa e premium, animais naturais, sem aparência de banco de imagens barato;
- energia solar: fotografia realista de arquitetura e painéis, céu e luz dramáticos sem ficção científica;
- segurança/tecnologia: cenas fotográficas escuras e sofisticadas, equipamentos reais, iluminação azul/ciano apenas como acento;
- B2B/consultoria: retratos/editorial corporativo ou detalhes arquitetônicos premium, nunca pessoas genéricas sorrindo para câmera.
13. Evite completamente aparência de template pronto: não use sequência repetitiva de cartões iguais, blobs aleatórios, glassmorphism sem propósito ou gradientes decorativos vazios.

Adapte cores, tipografia e tom de voz ao nicho específico do cliente, mas a ESTRUTURA e a SENSAÇÃO de "site que parece ter custado caro" descrita acima é obrigatória.
`;

export const OUTPUT_FORMAT = `
Formato OBRIGATÓRIO da sua resposta (não escreva nada fora desse formato, não use markdown, não use blocos de código com crases):

===IMAGES===
uma linha por imagem necessária, no formato:
id_da_imagem: prompt em inglês, detalhado, descrevendo uma FOTOGRAFIA publicitária realista profissional (não ilustração) para FLUX. Descreva sujeito, enquadramento, lente/câmera, iluminação, textura, fundo, posição do sujeito e espaço negativo necessário para a tipografia HTML. Termine com "no text, no logo, no watermark".
(gere entre 3 e 6 imagens: 1 hero grande, e o restante para os cards de destaque/produtos. dê ids curtos em snake_case, ex: hero, card_1, card_2, about)

===HTML===
o documento HTML completo, começando em <!DOCTYPE html> e terminando em </html>, 100% autocontido:
- CSS todo dentro de uma tag <style> no <head> (pode importar fontes do Google Fonts via @import url(...) dentro do <style>)
- JS opcional dentro de <script> no final do <body>, apenas para pequenas interações (menu mobile, smooth scroll) — nada de frameworks externos
- em TODO lugar onde uma foto for usada, use exatamente <img src="[[IMG:id_da_imagem]]" ...> com o id correspondente que você definiu na seção ===IMAGES===. Não use nenhuma outra URL de imagem, nunca use placeholder.com, unsplash ou picsum.
- todo o texto (títulos, menus, botões, depoimentos, rodapé) deve estar em português do Brasil e ser conteúdo real e específico do negócio informado, nunca "lorem ipsum" ou genérico como "Título aqui"
- o site deve ter uma única página (one-page) com âncoras internas para cada seção no menu
`;

export function buildUserPrompt(d: BusinessFormData): string {
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

export const FALLBACK_IMAGE_SVG =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="34">Imagem indisponível</text></svg>'
  );
