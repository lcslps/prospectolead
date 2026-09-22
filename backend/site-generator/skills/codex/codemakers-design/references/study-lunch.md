# Estudo LUNCH: intensidade na abertura, clareza na escolha

Base: [MD original fornecido](source-material/lunch.txt). O arquivo descreve um recorte editorial e comercial. Dados, produtos, wordmark e fotografias da referência não devem ser transferidos automaticamente para a identidade do cliente.

## A contribuição central

A referência usa contraste ao longo da página: uma abertura escura, fotográfica e dramática prepara uma sequência clara e contida para observar produtos. O espetáculo é concentrado, permitindo que a decisão de compra ocorra em uma interface menos ruidosa.

Isso ensina a distribuir intensidade. Um site marcante não precisa manter a mesma carga visual em todas as seções. O hero pode estabelecer memória; o catálogo sustenta reconhecimento, comparação e informação.

## Gramática observada

| Dimensão | No arquivo | O que aproveitar |
|---|---|---|
| Abertura | Fotografia escura e wordmark cromado | Um único gesto visual pode concentrar a assinatura |
| Conteúdo | Pergaminho `#F4F1E4` e marfim `#FCFAF1` | Superfície calma ajuda a comparar imagens e metadados |
| Tinta | Preto | Hierarquia pode vir de peso e estrutura, sem várias cores |
| Pontuação de marca | Lilás `#B8AAD0` | Cor pode marcar início/fim e pequenos momentos |
| Texto | Good Sans, pesos 400/700 | Uma família de trabalho pode sustentar o restante da página |
| Geometria | Bordas retas e galeria próxima | Continuidade de fotografia em vez de cards independentes |
| Densidade | Editorial espaçado, grid compacto | Cada parte recebe densidade compatível com sua função |

Os nomes de fonte e os tamanhos são evidência do documento, não assets disponibilizados ou especificação universal.

## Sequência de narrativa e compra

**Abertura:** apresente uma imagem com intenção de enquadramento e uma assinatura própria. Não faça a pessoa esperar uma animação para encontrar navegação ou entender o assunto.

**Ponte editorial:** explique de forma curta a coleção, o propósito ou a curadoria. O parágrafo deve justificar a seleção que vem a seguir, sem uma biografia longa usada apenas para ocupar espaço.

**Catálogo:** faça imagens e metadados manterem uma ordem consistente. Marca/produto, preço, variante e disponibilidade precisam ser reconhecíveis. O pequeno intervalo entre imagens não deve tornar alvos ambíguos nem eliminar respiro dos textos.

**Detalhe e ação:** quando a pessoa escolhe um produto, a informação necessária à decisão aparece em hierarquia clara. O fato de a referência usar links discretos não justifica esconder adicionar ao carrinho ou sua consequência.

**Encerramento:** uma faixa lilás pode fechar a narrativa, desde que navegação, atendimento e condições relevantes continuem legíveis.

## Mídia e wordmark

O wordmark cromado descrito é um objeto visual, não apenas texto com uma família declarada. Tipografia, extrusão, reflexão e interação com a foto dependem de asset ou composição apropriada. Não prometa essa aparência apenas com `font-family` e uma sombra de texto.

Em um projeto inspirado, crie assinatura própria ou use material fornecido. Se a implementação não comportar 3D, um render estático autorizado pode preservar a intenção. O asset gráfico não deve ser a única identificação textual acessível do site.

Mantenha a distinção entre fotografia editorial do hero e fotografia comparável de catálogo. Usar tratamento escuro e teatral em cada produto pode atrapalhar reconhecimento de cor, forma ou detalhe.

## Componentes e semântica

**Navegação sobre mídia:** cor precisa responder ao fundo efetivo. Trocar de texto claro para escuro deve se basear na seção real, não em um número mágico de scroll que quebra com altura diferente.

**Link sublinhado:** adequado a destinos e exploração. Quando o elemento executa uma ação, use botão com aparência textual se necessário. Aparência de link não muda semântica de um comando.

**Card de produto:** imagem, nome, preço e disponibilidade precisam permanecer associados. Não envolva ações internas em um link que cause navegação indevida. Evite reduzir metadados a 12px por obrigação de fidelidade numérica.

**Indisponibilidade:** o par lilás/pergaminho fornecido tem cerca de **1.913:1**. Para texto informativo pequeno, use uma tinta que ofereça contraste suficiente. Uma adaptação possível é `#675376` no mesmo pergaminho, aproximadamente **6.031:1**; isso é proposta da Code Makers, não cor oficial observada.

**Avisos utilitários:** o banner de cookies citado não é um elemento decorativo de estilo. Inclua apenas quando o produto realmente precisar e implemente o comportamento pertinente, sem inventar consentimento funcional.

## Receita de passagem editorial para catálogo

```css
.editorial-shop { --shop-paper: #f4f1e4; --shop-ink: #000000; --shop-lilac: #b8aad0; }
.editorial-shop__hero { color: #fcfaf1; background: #000000; }
.editorial-shop__catalog { color: var(--shop-ink); background: var(--shop-paper); }
.editorial-shop__intro {
  max-inline-size: 40rem;
  margin-inline: auto;
  padding: clamp(2.5rem, 6vw, 5rem) 1rem;
  line-height: 1.8;
}
.editorial-shop__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1.5rem 0.5rem;
}
.editorial-shop__status { color: #675376; }
```

O grid é uma adaptação responsiva. A referência cita 4–5 colunas e cerca de 5px de intervalo; preservar esses números em qualquer tela prejudicaria o conteúdo. O trecho separa espaço vertical de metadados e proximidade horizontal das imagens.

## Adaptação e movimento

No celular, reduza a quantidade de colunas e preserve nome, preço e status. Reposicione a assinatura do hero para não cortar o assunto nem cobrir controles. Uma abertura escura não exige `100vh` rígido: conteúdo, teclado e barras do navegador podem mudar a área útil.

O impacto pode ser estático. Motion, se usado, deve reforçar a transição entre capítulo editorial e catálogo, sem animar repetidamente todos os produtos ao filtrar.

## Transferência e prova

Útil para moda, coleções e portfólios com curadoria visual. Depende de imagens fortes e de informação comercial organizada. Funciona mal quando o hero impressiona, mas preço, disponibilidade ou destino da ação ficam vagos.

Verifique navegação nos dois contextos de fundo, leitura da disponibilidade, alvos em grades compactas, títulos longos, variantes e fluxo de compra no escopo autorizado.
