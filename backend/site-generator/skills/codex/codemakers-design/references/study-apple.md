# Estudo Apple (España): espaço que dá escala ao produto

Base: [MD original fornecido](source-material/apple.txt). Este capítulo interpreta esse documento; não afirma que todos os sites da Apple seguem essas regras nem que houve auditoria atual da marca. Para conflitos técnicos, leia [Normalização das referências](reference-normalization.md).

## A contribuição central

A força desta referência vem da relação entre um objeto bem apresentado e uma interface que reduz competição. O espaço vazio amplia importância porque contém poucos elementos com intenção: identificação, frase principal, ação, condição comercial e produto. Copiar apenas branco, botão azul e cantos arredondados deixa a estrutura sem conteúdo que justifique a escala.

Há duas decisões separadas: a tipografia cria uma afirmação visual forte; a interface ao redor permanece discreta. “Minimalista” não significa que tudo é pequeno ou de baixo peso. A referência usa títulos grandes e fortes, cercados por pouca informação concorrente.

## Gramática observada no documento

| Dimensão | Evidência fornecida | Aprendizado transferível |
|---|---|---|
| Superfícies | Branco e `#F5F5F7` alternados | Separar capítulos sem acrescentar moldura a cada bloco |
| Texto | `#1D1D1F`, títulos na faixa 80–96px | Dar escala ao assunto com texto curto e medida controlada |
| Ação | Azul `#0071E3`; links `#0066CC` | Distinguir ação da cor presente na mídia |
| Corpo | Referência frequente de 17px | Manter leitura confortável abaixo do display |
| Forma | Cards de 28px; ações em pílula | Coerência de família, sem tornar todo elemento igual |
| Ritmo | Grandes intervalos e trilho de conteúdo próximo a 1200px | Separar respiro de seção de espaçamento interno |
| Mídia | Produto, detalhe e acabamentos | Fazer a imagem explicar escala, construção ou diferença real |

Valores são observações do arquivo, não obrigações de todo projeto inspirado nele.

## Arquitetura de uma página inspirada

1. **Apresentação:** nome reconhecível, promessa específica e visual do produto. Dê ao visitante uma ação apropriada sem exigir rolar uma tela inteira de vazio.
2. **Demonstração:** mostre a característica que sustenta a promessa. Texto e enquadramento devem falar do mesmo benefício.
3. **Detalhe:** use close-up ou comparação quando a diferença precisar ser vista. Evite repetir a mesma renderização em outra cor sem informação nova.
4. **Escolha:** compare versões ou acabamentos com nomes, seleção e dados coerentes.
5. **Decisão:** reúna informações pertinentes de compra, contato ou continuidade, sem inventar preço ou disponibilidade.

A alternância de superfícies deve marcar mudança real de capítulo. Não é necessário trocar branco/cinza a cada componente.

## Componentes e comportamento

**Hero:** o tamanho do título depende do texto real e da largura. Títulos grandes precisam de acentos, quebras e expansão de idioma verificados. Preço e CTA devem continuar legíveis sem disputar o mesmo tamanho do display.

**Card de demonstração:** use área visual grande, subtítulo curto e detalhe progressivo quando necessário. Ausência de sombra pode funcionar quando superfície, recorte e espaço já distinguem o bloco. Não remova foco ou borda funcional para manter a aparência plana.

**Seletor de acabamento:** a referência descreve amostras sem nome dentro. Adapte para um controle com nome acessível, estado selecionado e informação da variante fora ou junto da amostra. Cor não pode ser a única maneira de reconhecer ou confirmar a opção.

**Link direcional:** seta reforça caminho, mas o texto precisa nomeá-lo. Links no corpo devem ser identificáveis; não condicione toda descoberta ao hover.

**Carrossel, se necessário:** pontos pequenos podem comunicar posição, mas controles clicáveis precisam de áreas adequadas. Não assuma que a dimensão visual de um ponto define o tamanho de seu alvo.

## Tipografia sem dependência de fonte proprietária

SF Pro Display/Text são famílias citadas na referência, não arquivos fornecidos. Confirme disponibilidade e condições de uso. Ao usar alternativa permitida, ajuste largura, peso, tracking e entrelinha pela fonte real; declarar “Inter” não reproduz automaticamente métricas de outra família.

Não ative `numr` globalmente: esse recurso corresponde a numeradores. Para comparação de números, avalie `font-variant-numeric: tabular-nums` quando suportado. O original também mistura linhas que parecem estar em pixels com valores sem unidade no CSS; normalize antes de usar.

## Receita CSS adaptada

Trecho de composição, não kit completo ou CSS oficial:

```css
.product-story {
  --story-ink: #1d1d1f;
  --story-paper: #ffffff;
  --story-wash: #f5f5f7;
  --story-action: #0071e3;
  color: var(--story-ink);
  background: var(--story-paper);
}
.product-story__chapter { padding-block: clamp(3.5rem, 7vw, 7.5rem); }
.product-story__chapter--wash { background: var(--story-wash); }
.product-story__inner { inline-size: min(100% - 2rem, 75rem); margin-inline: auto; }
.product-story__title {
  font-size: clamp(2.5rem, 1.4rem + 5vw, 6rem);
  line-height: 1.05;
  letter-spacing: -0.015em;
  max-inline-size: 15ch;
}
.product-story__copy { font-size: 1.0625rem; line-height: 1.47; max-inline-size: 60ch; }
```

A escala fluida preserva a ideia de grande título, sem fixar 96px em toda largura. Se centralizar a hero, mantenha parágrafos longos em medida legível. O contraste branco/azul da ação é aproximadamente 4.697:1 no par opaco; novos estados e combinações exigem sua própria verificação.

## Mobile, mídia e movimento

Reduza intervalos e reorganize conteúdo antes de diminuir texto indiscriminadamente. Reavalie recorte da mídia: a mesma imagem horizontal pode não explicar o produto no celular. Não imponha altura fixa que corte título, preço ou ação.

A referência fornecida não constitui especificação completa de animação. Reveals ou transições de produto são escolhas adicionais que precisam de função e fallback; não invente uma exigência de scroll cinematográfico. Uma imagem forte pode resolver a demonstração sem vídeo ou 3D em tempo real.

## Transferência e critério de sucesso

Funciona bem para produtos com qualidade visual demonstrável, versões comparáveis e uma história clara. Precisa de adaptação em operações densas, onde intervalos enormes aumentariam esforço.

Antes de concluir, confira se a pessoa identifica o produto, entende a principal diferença e encontra a próxima ação. Remova o nome da marca: a clareza e a relação entre objeto, tipo e espaço devem permanecer. Não copie textos comerciais, identidade ou dados da Apple para o cliente.
