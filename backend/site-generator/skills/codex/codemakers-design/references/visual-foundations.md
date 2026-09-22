# Fundamentos visuais aplicados

Leia quando a interface parece pouco resolvida, embora cores e componentes estejam corretos. Para repertório de estilos, consulte a base local descrita em [Biblioteca consultável](knowledge-library.md).

## Hierarquia: três escalas de leitura

Projete a leitura em três distâncias. Na visão geral, devem aparecer o assunto, a divisão das áreas e o ponto principal de atenção. Na leitura de um bloco, título, informação e ação precisam formar um grupo. Na operação, labels, estados e detalhes devem permitir decidir sem esforço excessivo.

Se a hierarquia funciona apenas quando o texto é lido integralmente, falta estrutura visual. Se funciona apenas em uma screenshot reduzida, detalhes importantes podem estar ilegíveis. Alterne as duas avaliações.

Use primeiro posição, agrupamento e espaço. Depois tamanho e peso. Reserve cor saturada, fundos e ícones de ênfase para diferenças que ainda precisem de expressão. Cinco técnicas simultâneas para destacar o mesmo botão geralmente tornam o entorno inconsistente.

## Relações perceptivas e decisões concretas

| Relação | Aplicação | Diagnóstico quando falha |
|---|---|---|
| Proximidade | Label mais perto do próprio campo que do campo anterior | O formulário parece atribuir o label ao controle errado |
| Similaridade | Mesmo tratamento para a mesma categoria de ação | Dois botões idênticos têm consequências muito diferentes |
| Região comum | Fundo agrupa um resumo com suas ações | Um retângulo envolve itens sem relação e sugere dependência falsa |
| Continuidade | Eixos e linhas guiam a leitura entre etapas | Colunas parecem desalinhadas porque cada bloco usa uma margem |
| Figura e fundo | Overlay claramente separado do conteúdo inativo | Texto do fundo compete com as ações do modal |
| Destino comum | Elementos relacionados se movem de forma coordenada | Cada item anima em direção diferente sem significado |
| Fechamento | Uma borda parcial pode sugerir grupo quando claro | Contornos incompletos tornam controles difíceis de identificar |

Esses princípios ajudam a explicar percepção, mas não dispensam observação da interface. Não derive números mágicos de uma “lei de UX”.

## Peso visual

Peso resulta de área, contraste, saturação, complexidade, posição e conteúdo. Uma fotografia pequena com rosto pode dominar uma grande área de texto. Um bloco escuro no rodapé pode equilibrar uma página clara; vários blocos escuros podem quebrar a narrativa.

Para diagnosticar competição, observe a página em escala reduzida e pergunte quais três elementos chamam atenção. Compare com a prioridade real. Para identificar alinhamento e espaçamento, retorne à escala de uso: a miniatura não revela toque ou leitura.

## Espaçamento com função

Comece por uma escala curta de valores reutilizáveis; ajuste opticamente quando formas exigirem. Separe espaços internos de controle, entre elementos relacionados, entre grupos e entre seções. Uma base de 4px pode ser útil em produtos digitais, mas não é uma obrigação estética.

Um sistema inicial poderia usar 4, 8, 12, 16, 24, 32, 48 e 72px. Aplique de acordo com a densidade do produto; não utilize todos os valores em uma única página. Para telas densas, preserve distinção entre grupos mesmo quando os espaços diminuem.

O padding de um card deve conversar com o espaço entre cards. Se interior e exterior têm a mesma distância, os limites semânticos podem ficar ambíguos. Agrupe antes de aumentar bordas.

## Ritmo e composição de página

Use repetição para previsibilidade e variação para marcar mudança. Em uma lista operacional, repetição rigorosa é útil. Em uma narrativa de produto, repetir seis seções idênticas pode reduzir atenção. Varie um eixo por vez: escala de mídia, posição do texto ou densidade, mantendo tokens e alinhamentos estáveis.

Crie pontos de repouso entre blocos densos. Espaço negativo deve melhorar leitura e ênfase; grandes vazios que afastam a ação do contexto são desperdício. Em páginas curtas, não acrescente altura apenas para produzir uma rolagem “cinematográfica”.

## Geometria e acabamento

- **Raio:** relacione cantos de superfícies e elementos internos; um chip muito arredondado dentro de um painel angular pode ser coerente se representar outra função.
- **Borda:** escolha o que precisa ser percebido. Divisor decorativo pode ser sutil; limite necessário para identificar um campo precisa ser distinguível.
- **Sombra:** sugere distância ou sobreposição. Direções e intensidades incoerentes deixam a tela parecendo uma colagem.
- **Ícones:** centralização matemática e óptica podem diferir; triângulos, setas e símbolos de play precisam de avaliação visual.
- **Imagem:** alinhe o foco visual com o fluxo de leitura, não só o retângulo do arquivo.
- **Texto:** margens em caixas não garantem alinhamento aparente se fontes têm métricas diferentes.

Evite transformar ajuste óptico em regra global. Registre uma exceção apenas quando recorrente e verificável.

## Diagnósticos frequentes

| Sintoma | Causa provável | Primeira tentativa útil |
|---|---|---|
| Tudo parece importante | Ênfase uniforme em cards, cores e títulos | Escolher um eixo dominante e reduzir acentos concorrentes |
| Página “sem personalidade” | Conteúdo e composição intercambiáveis | Usar material do domínio e uma relação visual característica |
| Visual “barato” | Espaçamento irregular, imagens fracas, tipografia inconsistente | Corrigir proporções e assets antes de adicionar efeitos |
| Minimalismo vazio | Informações removidas junto à decoração | Restaurar contexto, affordances e prova relevante |
| Visual pesado | Muitos limites, fundos e pesos fortes | Agrupar com espaço; reduzir superfícies independentes |
| Desktop bonito, mobile confuso | Ordem e prioridades não foram adaptadas | Redefinir sequência e proximidade da ação |
| Parece apresentação, não produto | Tudo é visualização estática | Completar tarefas, estados, navegação e feedback |
| Parece uma biblioteca sem marca | Componentes padrão sem direção específica | Ajustar tipo, proporção, mídia e ritmo de forma sistêmica |

## Critério de identidade

Descreva três escolhas concretas que dependem do produto. “Azul, sans-serif e cards” não é específico. “Status de carga alinhado ao trajeto, datas no ritmo de expedição e mapas restritos às decisões geográficas” é específico. Se a identidade depende de um efeito que precisa ser removido no mobile, desenvolva uma segunda expressão em conteúdo, tipografia ou layout.
