# Receitas de layout e arquitetura visual

Escolha pela relação de conteúdo. Diagramas abaixo representam áreas, não grids obrigatórios. Defina a ordem de leitura e a adaptação antes de distribuir colunas.

## 1. Demonstração ao lado da proposta

```text
marca              navegação / ação
proposta + contexto | demonstração do produto
ação + condição    | resultado reconhecível
evidência relevante
```

Serve a produtos que precisam ser vistos para ser compreendidos. Use mídia ou demonstração que realmente explique a oferta. Evite miniaturas de dashboards ilegíveis usadas apenas como decoração. No mobile, decida se a demonstração precisa aparecer antes da ação; não mantenha a proporção desktop por inércia.

## 2. Abertura editorial

```text
categoria / contexto
título com medida controlada
resumo / autoria / data
imagem ampla
coluna de leitura + apoio lateral
```

Serve a conteúdo que exige confiança e leitura contínua. A lateral pode conter sumário, notas ou contexto, mas não competir com cada parágrafo. Em telas estreitas, transforme apoios em blocos na posição pertinente. Não mantenha um sumário fixo que ocupe metade da tela.

## 3. Produto primeiro

Mídia dominante, nome e benefício próximos, variantes e compra facilmente acessíveis. Use detalhes de textura ou uso quando isso muda a decisão. Faça o zoom funcionar sem esconder controles. Galeria horizontal precisa mostrar navegação e funcionar com toque; imagem grande não justifica preço distante.

## 4. Índice com detalhes

Uma lista de objetos à esquerda e o objeto selecionado à direita funciona para inbox, CRM e suporte. Mostre qual item está selecionado; preservar scroll da lista pode ajudar ao voltar. No mobile, trate lista e detalhe como navegação explícita. Evite panes tão estreitos que nenhum lado fica utilizável.

## 5. Shell de aplicação

```text
navegação lateral | título + contexto + ações
                  | filtros / ferramentas
                  | área de trabalho
                  | paginação / status
```

A navegação global deve ser menos ruidosa que o trabalho. Sidebar colapsada exige rótulos descobríveis, destino claro e teclado. Não substitua nomes essenciais por ícones enigmáticos só para economizar largura.

## 6. Workspace com inspetor

Centro dedicado ao objeto; painel lateral para propriedades e uma barra de ferramentas estável. Serve a editores, mapas e composição. Se houver resize, defina mínimos e opção de restaurar. No mobile, o inspetor pode virar uma etapa ou painel alternável; encolher os três painéis raramente basta.

## 7. Comparação de planos

Alinhe características equivalentes e mostre período de cobrança. Destaque um plano quando houver uma razão verdadeira, não um selo inventado de popularidade. Explique limites e inclusões próximos ao preço. No mobile, preserve a possibilidade de comparar; uma sequência enorme de cards pode esconder diferenças.

## 8. Catálogo facetado

Busca e filtros perto dos resultados, quantidade visível e limpeza de restrições. Distribuição dos cards depende do conteúdo: comparação de especificações pede alinhamento; portfólio fotográfico pode aceitar proporções diversas. Não use masonry quando a ordem for significativa ou dificultar comparação.

## 9. Narrativa alternada

Blocos de imagem e texto alternam ênfase para explicar diferentes aspectos. Cada seção precisa de uma função distinta, não só outra lista de vantagens. Mantenha a mesma ordem semântica no DOM; reordenações visuais não podem prejudicar teclado ou leitura assistiva.

## 10. Grade de capacidades

Uma grade assimétrica pode hierarquizar capacidades diferentes. O tamanho de cada área deve corresponder à relevância ou ao tipo de conteúdo. “Bento” não é motivo para inventar módulos, comprimir textos ou adicionar contadores falsos.

## 11. Jornada por etapas

Use quando cada etapa reduz complexidade ou representa uma decisão real. Mostre contexto, progresso e possibilidade de revisão. Etapas opcionais e ramificações exigem progresso honesto. Uma barra “3 de 5” incorreta após ramificação é pior que uma indicação textual clara.

## 12. Resultado com evidência

Abra com a resposta ou situação, apresente a evidência e permita examinar detalhe. Serve a análise e investigação. Não use a conclusão como título se os dados não a sustentam. Contexto como período, unidade e fonte deve permanecer próximo do resultado.

## 13. Calendário e agenda

Permita alternar entre visão temporal e lista quando ambas forem úteis. Eventos sobrepostos precisam de distinção e detalhes acessíveis. No mobile, agenda pode ser mais adequada que comprimir uma grade semanal. Fuso, duração e estado de confirmação devem ser claros.

## 14. Página utilitária de foco único

Conversor, upload ou ferramenta simples pode precisar apenas de título, entrada, ação, resultado e ajuda. Não acrescente navegação complexa ou longas seções comerciais que interrompam a tarefa. O resultado deve permitir copiar, baixar ou continuar quando isso fizer parte do pedido.

## Implementação de grid elástico

```css
.collection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1.5rem;
}
.collection > * { min-inline-size: 0; }
.collection img { display: block; max-inline-size: 100%; block-size: auto; }
```

Esse padrão evita que a largura mínima do card ultrapasse um container pequeno. `auto-fit` pode expandir poucos cards demais; use `auto-fill`, limites ou uma grade explícita quando o conteúdo pedir largura estável. Não escolha o padrão sem testar um, dois e muitos itens.

## Implementação de coluna de leitura com apoio

```css
.article-layout { display: grid; gap: 2rem; }
.article-layout > * { min-inline-size: 0; }
.article-body { max-inline-size: 68ch; }
@media (min-width: 64rem) {
  .article-layout { grid-template-columns: minmax(0, 1fr) 16rem; }
  .article-aside { align-self: start; }
}
```

O breakpoint é ilustrativo. Se tornar o apoio sticky, confira altura, container de rolagem e foco. Não use sticky por padrão para texto que pode ser lido naturalmente.

## Escolha e crítica

Explique em uma frase qual relação o layout torna mais fácil: comparar, encontrar, acompanhar, editar, entender ou comprar. Se a única justificativa for “fica moderno”, volte ao conteúdo. Na revisão, teste a composição sem imagem perfeita e com título duas vezes maior; isso expõe fragilidade antes da entrega.
