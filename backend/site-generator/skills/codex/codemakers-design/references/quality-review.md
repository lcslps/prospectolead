# Revisão de qualidade Code Makers

## Estabeleça a prova antes da revisão

Converta o pedido em critérios observáveis. Exemplo: “o menu abre por toque e teclado, mantém foco visível, fecha de forma previsível e não encobre o formulário em tela pequena”. “Ficou premium” não é um critério verificável.

Para redesign, registre a condição inicial que explica o problema. Para reprodução, use referência e viewport correspondentes. Para criação, compare com contrato visual e jornada. Um build aprovado não é evidência visual.

## Inspeção proporcional

Em mudança substancial, revise uma viewport ampla e uma estreita; escolha tamanhos reais do projeto, como 1440 e 390 CSS px quando não houver alvo definido. Adicione largura intermediária onde o layout muda, reflow equivalente a 320 CSS px e zoom quando pertinentes. Esses valores são condições de teste, não breakpoints obrigatórios.

Inspecione topo, meio, fim e overlays relevantes. Veja screenshots com ferramenta que permita examinar a imagem; apenas salvar o arquivo não é revisão. Espere carregamento real de fontes e mídia sem ocultar estados transitórios que precisam ser avaliados.

Confira os temas suportados e movimento reduzido quando a mudança os afetar. Em ajuste pontual, concentre a prova no defeito e possíveis regressões próximas.

## Matriz de evidência

| Área | O que verificar | Evidência útil |
|---|---|---|
| Brief e identidade | Assunto, marca, conteúdo e hierarquia correspondem ao pedido | Referência comparada e decisões concretas |
| Composição | Alinhamentos, ritmo, medida de leitura, recorte e densidade | Screenshots nos estados relevantes |
| Jornada | Ação principal produz o resultado esperado | Passos executados e estado final |
| Conteúdo extremo | Texto longo, valores grandes, zero registros e erro | Fixtures locais ou estados reproduzíveis |
| Responsividade | Conteúdo acessível, sem clipping involuntário e sem foco encoberto | Viewports, zoom e overlays inspecionados |
| Acessibilidade | Semântica, nomes, teclado, foco, contraste e feedback | Percurso manual e resultados de ferramentas, com limites |
| Robustez | Build, rotas, assets e integração preservados | Comandos executados, testes pertinentes e console |
| Desempenho | Regressões plausíveis e gargalos observados | Métricas medidas sob condições declaradas |

Use somente linhas relevantes. Status possíveis: **verificado**, **falhou**, **não aplicável**, **não verificado**. Não transforme “não verificado” em aprovado por dedução.

## Prioridade dos achados

- **Bloqueador:** impede a tarefa, produz resultado incorreto, perde dados, torna conteúdo essencial inacessível ou rompe a aplicação. Corrija antes do acabamento.
- **Importante:** exige esforço evitável, oculta informação relevante, quebra layout em condição suportada ou diverge claramente da referência.
- **Refinamento:** ritmo, alinhamento óptico, tratamento de mídia e detalhes de consistência sem bloqueio funcional.

Formato de achado: condição e local → problema observado → consequência → menor correção adequada → forma de verificar. Separe defeitos de preferências estéticas. Em auditorias, não liste conjecturas como falhas confirmadas.

## Passes de refinamento

1. Resolva os bloqueadores e divergências grandes de estrutura ou comportamento.
2. Refine hierarquia, espaço, tipografia, cor, mídia e microcopy que enfraquecem o contrato visual.
3. Reinspecione condições alteradas e conclua quando critérios pertinentes estiverem atendidos.

Não acrescente decoração como resposta automática a “falta acabamento”. Primeiro reduza competição e corrija proporção. Não é necessário testar novamente tudo se a mudança só afeta uma condição conhecida; amplie a verificação quando surgir evidência de risco mais amplo.

## Conclusão honesta

Entregue resultado, principal decisão, verificação realizada e limitações materiais. Exemplos:

- “Filtros e paginação funcionando com os dados locais; revisado em 390 e 1440 px, inclusive vazio e erro. Integração de API ainda não faz parte deste protótipo.”
- “Corrigido o foco encoberto no modal. Verificado por teclado e com conteúdo longo; leitor de tela indisponível neste ambiente.”

Não atribua notas arbitrárias de 98/100, excelência mundial, acessibilidade total ou aumento de conversão sem um método e dados que sustentem isso. A rubrica orienta trabalho; não substitui pessoas usando o produto.
