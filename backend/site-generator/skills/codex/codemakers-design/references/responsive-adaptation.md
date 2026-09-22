# Adaptação responsiva e condições difíceis

Responsividade inclui largura, altura, entrada, zoom, idioma, conteúdo e contexto de embedding. Não se resume a três screenshots.

## Matriz de adaptação

| Condição | Decisão que precisa mudar |
|---|---|
| Viewport estreita | Ordem, número de colunas, proximidade de ação e conteúdo |
| Viewport baixa | Altura de overlay, barras fixas e acesso às ações |
| Container pequeno em tela ampla | Anatomia do componente, não necessariamente toda a página |
| Ponteiro impreciso | Área de toque e ausência de hover essencial |
| Teclado físico | Ordem, foco, atalhos e saída de overlays |
| Teclado virtual | Campo visível, botões alcançáveis e altura útil |
| Zoom e texto ampliado | Reflow, títulos, altura de campos e navegação |
| Conteúdo localizado | Expansão, pluralização, números e direção do texto |
| Imagem ausente | Hierarquia e layout ainda compreensíveis |
| Rede lenta | Conteúdo parcial, estabilidade e feedback |

## Container queries

Componentes que aparecem em sidebar e área principal podem responder ao espaço disponível, em vez de usar apenas a viewport. Exemplo com fallback em coluna:

```css
.product-slot { container-type: inline-size; }
.product-summary { display: grid; gap: 1rem; }
.product-summary > * { min-inline-size: 0; }
@container (min-width: 34rem) {
  .product-summary { grid-template-columns: 10rem minmax(0, 1fr); }
}
```

O container é ancestral do componente consultado. Confirme suporte no projeto e evite aplicar contenção indiscriminadamente. Veja [container queries na MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

## Navegação e ações

No mobile, transforme arquitetura com intenção. Menu colapsado precisa de botão visível, estado coerente e conteúdo fechado fora da ordem de foco. Navegação inferior pode ser útil para poucos destinos frequentes; não a adicione a um site editorial só por parecer aplicativo.

Ao fixar CTA, reserve espaço e verifique se não cobre conteúdo ou foco. Em formulários, o teclado virtual pode tornar uma barra fixa inconveniente. Teste o caso com campo próximo ao fim da tela.

## Tabelas e áreas bidimensionais

Uma tabela larga pode precisar de rolagem própria. Mostre que há conteúdo adicional e preserve cabeçalhos úteis. Fixar coluna tem custo de espaço: uma coluna fixa muito larga pode deixar apenas poucos pixels para os demais dados.

Mapa, diagrama ou editor podem exigir duas dimensões. Dê controles de navegação e uma alternativa pertinente; não esconda overflow necessário. Para texto e formulários comuns, corrija overflow involuntário.

## Imagens e direção de arte

Uma imagem horizontal nem sempre funciona ao centro de um crop vertical. Use ponto focal, recorte alternativo ou outra imagem autorizada quando necessário. Não cubra rostos ou detalhes do produto com texto sem avaliar cada largura. `object-fit: cover` resolve preenchimento, não composição.

## Propriedades lógicas

Use `margin-inline`, `padding-block`, `inline-size` e alinhamento start/end quando a adaptação de direção for relevante. Não espelhe automaticamente ícones cuja orientação tem significado próprio. Números, código e trechos de outra escrita podem precisar de direção local.

## Conteúdo extremo

Teste título curto e muito longo, nome sem espaços, ausência de descrição, números grandes, imagem indisponível e quantidade variável de ações. Evite altura fixa em cards cujo conteúdo varia sem regra. Truncamento só é aceitável se preservar a decisão e permitir acesso ao conteúdo necessário.

## Sequência de diagnóstico

Quando quebrar: localize o elemento que excede o container; inspecione largura mínima, flex/grid, conteúdo sem quebra, posição e transform; corrija a causa; reinspecione a largura adjacente ao breakpoint. Não crie cinco novos breakpoints para contornar um `min-width` incorreto.

## Evidência

Selecione condições pela mudança. Um novo shell pede ampla, estreita, altura baixa, menu e foco; um ajuste de tipografia pede conteúdo longo e zoom; um card embutido pede múltiplos containers. Registre o que realmente foi observado e não declare cobertura de todos os dispositivos.
