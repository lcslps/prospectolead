# Diagnóstico e refinamento visual

Use quando a UI está “estranha”, genérica ou divergente da referência. Transforme impressão em hipótese observável antes de alterar dez propriedades.

## Comparação em camadas

1. **Estrutura:** ordem, áreas principais, larguras e proporções.
2. **Hierarquia:** atenção, títulos, agrupamentos e ações.
3. **Tipografia:** fonte realmente carregada, peso, medida e quebras.
4. **Mídia:** conteúdo, recorte, escala e foco.
5. **Superfície:** cor, borda, sombra, raio e contraste.
6. **Operação:** estados, foco, feedback e estabilidade.

Corrigir na ordem reduz retrabalho: refinar sombra de um card que vai mudar de tamanho não resolve o maior desvio.

## Diagnóstico por sintoma

| Sintoma observado | Inspecionar | Correção provável | Prova |
|---|---|---|---|
| Título quebra diferente da referência | Fonte carregada, peso, largura e tracking | Corrigir métricas antes de inserir `<br>` | Mesmo viewport e conteúdo |
| Card ultrapassa o grid | `min-width`, conteúdo sem quebra, tracks | Permitir encolhimento e definir largura mínima adequada | Texto extremo e tela estreita |
| Espaçamento parece aleatório | Margens colapsadas, gap e padding acumulados | Estabelecer um responsável pelo espaço | Comparar blocos irmãos |
| Modal aparece atrás do header | Stacking context, transform, portal | Corrigir contexto, não apenas aumentar z-index | Abrir com header sticky |
| Sticky não funciona | Ancestral com overflow, altura e limites | Ajustar container ou posição | Rolar no container real |
| Ícone parece fora do centro | ViewBox, desenho, baseline e área de toque | Ajuste óptico local | Escala normal e diferentes ícones |
| Botão muda de tamanho ao enviar | Label trocado, spinner e largura | Reservar anatomia e preservar nome | Ciclo enviar/falhar/tentar |
| Fonte muda o layout após carregar | Fallback e métricas do arquivo | Estratégia de carga e fallback | Antes/depois da fonte |
| Texto do tema escuro fica fraco | Par efetivo, opacity herdada | Ajustar papel semântico e estado | Medição do par real |
| Borda não aparece num tema | Token, transparência e fundo adjacente | Diferenciar função de divisor e controle | Ambos os temas |
| Interface pisca ao navegar | Estado reiniciado, hydration ou assets | Corrigir ciclo e fonte do estado | Rota inicial e navegação interna |
| Mobile tem scroll lateral | Largura fixa, transform, pre, tabela | Corrigir origem ou conter área legítima | Largura do documento e elemento |
| Foco desaparece no erro | Remontagem, mudança de chave ou disabled | Preservar nó ou reposicionar logicamente | Submissão por teclado |
| Lista salta ao atualizar | Alturas, keys, imagens sem dimensões | Estabilidade de identidade e tamanho | Update com conteúdo variável |
| Efeito trava a rolagem | Eventos, layout por frame, blur e camadas | Reduzir trabalho e medir | Dispositivo/condição afetados |
| CTA parece secundário | Proximidade, contraste e competição | Dar contexto e reduzir concorrência | Leitura em escala de uso |
| Parece um template | Conteúdo intercambiável e layout padrão | Retomar domínio e contrato visual | Explicar escolhas específicas |
| Redesign ficou menos usável | Informação removida ou caminho alongado | Restaurar contexto e ações úteis | Comparar a mesma tarefa |

## Inspeção de CSS

Leia computed styles e regras aplicadas quando disponível. Um valor no arquivo pode estar sobrescrito, herdado ou não corresponder à classe renderizada. Resolva cascata e origem em vez de empilhar overrides.

Verifique `box-sizing`, dimensões intrínsecas, shrink de flex, mínimos do grid, margens, pseudo-elementos e transformações. Um elemento invisível ainda pode ocupar espaço ou bloquear interação. Diferencie `opacity: 0`, `visibility: hidden`, `display: none` e atributo `hidden` conforme comportamento real.

## Refinamento de referência

Compare viewport e escala equivalentes, mesmo conteúdo e assets. Corrija largura de container, proporção da hero, tamanho e medida do título, recorte da imagem e ritmo das seções. Só depois ajuste tracking, sombras e bordas. Diferença de antialiasing entre ambientes não exige redesenhar a fonte.

Evite usar screenshot como prova de lógica ou acessibilidade. Ela mostra o estado capturado; comportamento precisa ser exercitado.

## Revisão de conteúdo

Leia labels e mensagens em sequência de uso. Se “Continuar” envia definitivamente, renomeie a ação. Se “Salvo” aparece antes da persistência, corrija estado e texto. Remova slogans que não ajudam a reconhecer o produto ou decidir.

## Quando parar

Conclua quando os defeitos observados e critérios do pedido estiverem resolvidos. Um novo passe precisa de motivo concreto: falha encontrada, mudança que afeta outra condição ou divergência persistente. Não crie perfeccionismo indefinido nem entregue com falhas conhecidas relevantes escondidas por uma nota estética.
