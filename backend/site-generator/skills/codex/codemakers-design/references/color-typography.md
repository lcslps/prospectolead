# Cor e tipografia: seleção, construção e verificação

Use com [Direção de arte](art-direction.md) e com a base de paletas e pares tipográficos em [Biblioteca consultável](knowledge-library.md).

## Construção de paleta por papéis

Não comece criando dez tons de uma cor sem saber onde serão usados. Primeiro liste superfícies, textos, ações, seleção, estados e gráficos. Defina quais precisam ser distintos e quais podem compartilhar um papel.

Uma paleta mínima de aplicação costuma precisar de fundo, superfície, texto, texto secundário, ação e texto da ação. Bordas, foco e estados entram conforme os componentes. Produto com gráficos precisa de sistema de dados separado do sistema de ações.

Selecione o tom de ação pela combinação de marca, legibilidade e destaque no contexto. Um azul que contrasta bem com branco pode desaparecer perto de um gráfico igualmente azul. Escolha distribuição, não só valores hexadecimais.

## Proporção e temperatura

Neutros controlam a sensação geral porque ocupam grande parte da tela. Neutro frio pode conversar com imagens técnicas; neutro quente pode acompanhar materiais orgânicos. Essas são hipóteses, não associações obrigatórias de setor.

Use saturação como orçamento de atenção. Se a superfície já é intensa, o botão pode se destacar por luminosidade e forma. Evite regras percentuais rígidas de distribuição de cor; uma landing imersiva e um editor de dados precisam de proporções diferentes.

## Escalas e estados

Uma escala deve funcionar em uso: superfícies claras distinguíveis, textos fortes, estados de ação e opções para tema escuro. Tons numerados não garantem diferenças perceptivas uniformes. Ao usar espaços perceptivos como OKLCH, verifique gamut e resultado efetivo nos navegadores suportados; sempre confirme pares finais.

Derive hover e active sem perder contraste e sem depender de mudança mínima imperceptível. Foco precisa continuar visível quando hover, erro ou seleção também estão ativos. Não apague o anel de foco porque outro estado “tem prioridade”.

## Matriz de pares

Verifique explicitamente:

1. Texto principal e secundário em cada superfície usada.
2. Texto da ação em repouso, hover, active e carregamento.
3. Links no corpo e distinção de sua função além de cor quando necessária.
4. Texto de erro e aviso em superfície normal e superfície de status.
5. Foco contra as superfícies que o cercam.
6. Labels e elementos informativos de gráficos.

O verificador incluído cobre apenas pares opacos. Paletas da base trazem três pares pré-calculados: texto/fundo, texto/superfície e texto-da-ação/ação. Isso não aprova qualquer combinação entre as cores. Texto secundário, estado hover, bordas e foco precisam de verificação adicional.

## Tipografia por tarefa

| Papel | Decisão de desenho | Erro comum |
|---|---|---|
| Display | Personalidade e proporção em poucas palavras | Usar a mesma expressividade em parágrafos |
| Título de interface | Hierarquia compacta e leitura rápida | Aumentar todos os títulos até competir com os dados |
| Corpo | Ritmo, legibilidade e cobertura do idioma | Escolher só pela beleza de um título |
| Label | Nome reconhecível junto ao controle | Caixa alta extensa e pouco espaçamento |
| Dados | Comparação, alinhamento e símbolos | Números com larguras variáveis desalinhados |
| Código | Distinção entre caracteres e cópia | Usar fonte decorativa para terminais |
| Legenda | Contexto próximo da mídia | Tornar “secundário” pequeno e pouco contrastante |

## Pareamento de fontes

Combine por função: contraste de construção, peso ou largura com uma qualidade comum de proporção. Serif display com sans de interface é uma possibilidade; duas sans com personalidades diferentes também podem funcionar. Uma família com variação suficiente reduz carga e mantém coesão.

Antes de decidir, teste uma amostra real: título longo, preço, data, botão, erro, parágrafo e nome acentuado. Inclua “Ação, João, São Luís, R$ 1.234,56, 0O1Il”. O teste não certifica cobertura de todos os idiomas; ele expõe problemas frequentes no conteúdo atual.

Os pares da biblioteca são candidatos, não assets instalados. Confirme licença, pesos, fonte oficial, formato e suporte aos caracteres necessários antes de usar. Não acrescente fontes remotas se o projeto exigir operação offline ou uma política de assets local.

## Escala e densidade

Escolha uma escala que produza hierarquia visível no produto real, não somente proporções elegantes em uma tabela. Um sistema de exemplo:

```css
:root {
  --text-note: 0.875rem;
  --text-body: 1rem;
  --text-lead: 1.125rem;
  --text-section: clamp(1.5rem, 1.2rem + 1vw, 2.25rem);
  --text-display: clamp(2.25rem, 1.5rem + 3vw, 4.75rem);
  --leading-body: 1.6;
  --measure-reading: 66ch;
}
.reading { max-inline-size: var(--measure-reading); line-height: var(--leading-body); }
.display { font-size: var(--text-display); line-height: 1.06; }
```

É uma escala ilustrativa. Verifique ampliação, quebras e viewport estreita; `clamp()` não garante acessibilidade sozinho. Preserve texto legível se a fonte não carregar. Evite alturas fixas em blocos com conteúdo localizado.

## Quebras, truncamento e alinhamento

Use truncamento quando o texto completo estiver acessível por um caminho razoável. Não trunque a única informação que permite distinguir dois itens. Um tooltip não é solução universal em toque.

Títulos podem ser balanceados com recursos do CSS quando suportados, mas continuam precisando de teste. Conteúdo de operação deve privilegiar previsibilidade sobre quebras editoriais. URLs e identificadores podem precisar de quebra específica; valores monetários normalmente precisam preservar unidade e valor próximos.

## Tema escuro e contraste aparente

Evite converter a paleta por inversão. Reavalie hierarquia de superfícies, saturação, sombras, texto e estados. Branco muito forte em grandes áreas escuras pode competir com tudo; suavizar é possível sem abandonar contraste apropriado. Não use saturação como único marcador de status.

## Fontes e carregamento

Escolha apenas pesos usados. Ao usar fonte variável, confirme eixos e limites disponíveis; não invente pesos que o arquivo não suporta. Ajustes métricos de fallback podem reduzir saltos, mas devem se basear na fonte real. O CSS deve prever fallback antes de baixar o asset.

Quando a fonte fornecida for inadequada para texto pequeno, avalie restringi-la a display e propor uma fonte de leitura compatível, preservando a identidade. Se o usuário exige a mesma fonte em toda a UI, ajuste tamanho, peso, largura e ritmo antes de sugerir mudança.
