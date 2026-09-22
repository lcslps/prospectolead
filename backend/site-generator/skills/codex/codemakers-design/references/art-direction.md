# Direção de arte

## Transforme o assunto em decisões

Parta dos materiais, ferramentas, linguagem e hábitos do domínio. Uma escola de música pode usar ritmo para organizar um calendário; uma plataforma de logística, continuidade de percurso; um arquivo de fotografia, enquadramento. Use associações que esclarecem a experiência. Evite presumir que toda empresa tecnológica precisa de circuitos ou que todo produto de saúde precisa de verde.

Descreva a direção em termos executáveis: “títulos compactos, alinhamento em colunas, fotografia documental e azul de sinalização reservado à ação” é mais útil que “premium, moderno, incrível”.

Em criações abertas, contraste duas hipóteses em estrutura, tipografia e mídia. Mudar apenas a cor não produz outra direção. Escolha por adequação à tarefa, conteúdo disponível, legibilidade e custo de implementação.

## Repertório orientado por contexto

Use a matriz como estímulo, não como associação obrigatória de indústria a estilo. Misture linguagens que compartilhem uma lógica estrutural.

| Direção | Pode servir a | Construção | Assinatura possível | Limite |
|---|---|---|---|---|
| Editorial de leitura | Publicação, ensaio, pesquisa | Coluna de leitura, títulos claros, legendas | Relação entre citação e imagem | Evitar texto pequeno para imitar jornal |
| Catálogo de arquivo | Museu, biblioteca, coleção | Índice, metadados, grade alinhada | Numeração real do acervo | Metadados não são ornamento |
| Oficina material | Cerâmica, mobiliário, artesanato | Fotografia de processo e detalhes de produção | Transformação da matéria | Textura não deve atrapalhar texto |
| Instrumento técnico | Operação, laboratório, engenharia | Densidade controlada, números tabulares, estados claros | Contexto alinhado ao objeto de trabalho | Evitar HUD decorativo |
| Comércio demonstrativo | Produtos com benefício visual | Produto em uso, comparação factual, compra próxima | Relação entre detalhe e escala humana | Imagem não substitui preço |
| Hospitalidade luminosa | Turismo, gastronomia, espaços | Imagens ambientais, ritmo pausado, disponibilidade | Composição de lugar e serviço | Reserva precisa ser fácil de encontrar |
| Cívico direto | Serviços públicos, educação utilitária | Linguagem simples, navegação previsível | Etapas e documentos claros | Originalidade não pode aumentar esforço |
| Lúdico construtivo | Aprendizado, criação | Geometria modular, cor funcional, feedback expressivo | Mecanismo de montagem ou progresso | Evitar competição de movimento e som |
| Galeria imersiva | Fotografia, audiovisual, portfólio | Imagem dominante, navegação estável | Recortes e sequência autorais | Projetos visíveis sem hover |
| Esportivo cinético | Eventos, esporte, lançamento | Tipo condensado legível, recorte dinâmico | Sequência temporal ou placar real | Movimento não deve impedir leitura |
| Serviço acolhedor | Cuidado, comunidade, suporte | Mensagens concretas, caminhos curtos | Linguagem e ilustração humanas | Evitar infantilização |
| Produto silencioso | Produtividade, finanças pessoais | Espaçamento preciso, poucas superfícies | Relação entre editar e revisar | Minimalismo não justifica controles invisíveis |
| Gráfico expressivo | Cultura, festival, estúdio | Tipo como composição, contrastes de escala | Motivo ligado à programação | Nem todo título precisa ser um cartaz |
| Científico explicativo | Dados, análise, pesquisa | Anotações junto à evidência, unidades e fonte | Exploração guiada da pergunta | Não sugerir certeza não sustentada |

## Composição e ritmo

- Desenhe blocos por relação de conteúdo, não por template fixo “hero, três cards, depoimentos, CTA”. Defina por que cada seção existe.
- A primeira dobra deve tornar reconhecíveis assunto e caminho principal. Uma demonstração ou catálogo pode cumprir isso melhor que um slogan gigante.
- Alterne escala e densidade quando houver mudança real de assunto. Dê mais espaço entre grupos do que dentro deles.
- Mantenha eixos de alinhamento. Assimetria exige compensação visual e ordem de leitura coerente no DOM.
- Use bordas para separar, fundos para agrupar e sombras para sobreposição; não aplique os três a cada bloco.
- Reserve maior ênfase para o que importa. Se títulos, badges, fundos e botões gritam juntos, reduza competição.
- Revise meio e fim da página. Uma ótima hero não resolve repetição cansativa ou rodapé sem orientação.

## Tipografia

Escolha papéis antes de nomes: display, leitura, interface e dados. Uma única família pode atender ao projeto. Introduza outra quando trouxer contraste funcional ou personalidade justificável.

Verifique caracteres do idioma, acentos, símbolos monetários, numerais, pesos disponíveis, licença e carregamento. Não afirme ter carregado uma fonte só porque seu nome aparece no CSS. Use fallback coerente.

Defina tamanho, peso, entrelinha, largura de texto e tracking por papel. Como ponto de partida ajustável, leitura pode usar 1rem ou mais, entrelinha próxima de 1.5–1.7 e medida de 45–75 caracteres; idiomas, fontes e contexto podem pedir outra configuração. Dados densos exigem boa leitura, não simplesmente letras menores.

Títulos com `clamp()` precisam de limites legíveis. Evite tamanhos baseados só em viewport que encolhem sob zoom. Uma quebra editorial bonita no desktop pode produzir palavra isolada no celular. Evite tracking negativo agressivo em texto pequeno.

Para números comparáveis, use alinhamento consistente e `font-variant-numeric: tabular-nums` se disponível. Preserve a distinção entre zero, ausência e desconhecido.

## Cor e superfície

Defina pares: fundo/texto, ação/texto da ação, superfície/texto, seleção/texto e status/texto. Uma paleta sem pares verificados é uma hipótese. Texto secundário continua sujeito ao critério para seu tamanho, inclusive no tema escuro.

Escolha neutros por temperatura e relação com imagens. Separe marca de erro, sucesso e aviso quando a ambiguidade afetar uso. Avalie tons saturados no tamanho real da superfície.

Nenhuma estética é proibida por ser popular. Gradiente, glassmorphism, preto com neon, serifas e cantos arredondados são recursos disponíveis quando o brief os sustenta. O erro é aplicá-los indiscriminadamente. Ausência de roxo não prova originalidade.

## Imagem, ícones e assinatura

Prefira assets fornecidos, imagens autorizadas pertinentes ou geração de imagem quando disponível e útil. Se faltar um asset essencial, explicite o limite e construa uma alternativa coerente. Não apresente URLs quebradas ou placeholders como arte final.

Planeje proporção, ponto focal, recorte por viewport, texto alternativo e tamanho de entrega. Texto essencial deve permanecer texto real. Preserve proporção e área de proteção de logos.

Use uma família de ícones consistente. Ajuste alinhamento óptico e área de toque. Ícones ambíguos precisam de texto; decoração não deve ganhar rótulos redundantes. Emoji pode pertencer à linguagem do produto, mas não substitui involuntariamente um sistema visual.

Uma assinatura pode ser uma comparação interativa, um recorte, uma transição ou uma relação tipográfica. Ela precisa sobreviver no mobile e com movimento reduzido.

## Reprodução de referência

Observe primeiro limites do conteúdo, grid, espaçamentos, escala de títulos, largura de leitura, proporção de mídia e contraste. Resolva esses desvios antes de sombras.

Use o mesmo viewport da referência quando possível. Compare fonte carregada, quebras, recortes, alinhamento e densidade. Não redesenhe algo pedido como reprodução. Screenshots não provam estados interativos, acessibilidade nem regras responsivas; infira com moderação e identifique hipóteses materiais.
