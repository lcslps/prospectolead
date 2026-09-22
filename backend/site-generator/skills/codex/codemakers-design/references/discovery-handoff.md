# Descoberta, referência e handoff

Use em criação substancial, redesign ou trabalho com múltiplas páginas. Para ajuste pontual, leia apenas o contexto necessário e evite um processo de descoberta desproporcional.

## Extrair um brief utilizável

Identifique público, situação, tarefa, conteúdo, diferenciais comprováveis, identidade, plataforma, restrições e formato de entrega. Separe explicitamente o que foi fornecido, observado no projeto e assumido para avançar.

Uma frase operacional ajuda: “Pessoa com pouco tempo precisa comparar três opções e entender a consequência antes de escolher.” Isso orienta o layout melhor que “público de 25 a 45 anos que gosta de inovação”. Demografia só é útil quando muda uma decisão real.

## Inspecionar um projeto existente

Leia componentes e telas próximas, tokens, estilos globais, roteamento e contratos de dados. Observe o comportamento antes de propor mudança. Uma inconsistência aparente pode ser uma distinção funcional; confirme antes de uniformizar.

Registre problemas observáveis em vez de julgar “design antigo”. Exemplo: “a ação para editar fica fora da tela a 390px” ou “três labels diferentes nomeiam a mesma operação”. Isso torna o redesign revisável e reduz mudanças arbitrárias.

## Referências visuais

Use referências por propriedades: proporção, ritmo, tipografia, mídia ou interação. Não copie cegamente a composição de uma empresa diferente. Para referência fornecida pelo usuário, determine se o pedido é reprodução fiel ou inspiração; se o texto já definir, siga sem reconfirmar.

Ao pesquisar uma referência externa, use a ferramenta disponível e fontes reais. Não afirme que analisou um site que não conseguiu abrir. Screenshots de concorrentes não comprovam conversão nem acessibilidade.

## Separar invariantes e liberdade

| Invariante possível | Liberdade possível |
|---|---|
| Logo e cores oficiais | Distribuição de superfícies e proporção |
| Rotas e contratos de dados | Hierarquia local e organização visual |
| Componente acessível existente | Tipografia, espaçamento e variante |
| Screenshot a reproduzir | Comportamentos não observáveis, identificados como hipótese |
| Stack e versão do projeto | Componentização e CSS dentro das convenções |
| Conteúdo factual fornecido | Ordem narrativa e microcopy sem alterar sentido |

Não trate a coluna da direita como licença universal: o pedido pode restringi-la também.

## Contrato de design revisável

Um contrato curto pode conter:

```text
Tarefa: o que a pessoa conclui.
Contexto: onde usa, com que frequência e com quais limites.
Prioridade: o que aparece primeiro, depois e sob demanda.
Direção visual: escolhas específicas de tipo, cor, mídia e composição.
Sistema: tokens e componentes existentes ou novos necessários.
Estados: comportamento inicial, ação, resultado e falhas relevantes.
Adaptação: mudança de ordem, densidade e navegação em pouco espaço.
Prova: condições que serão realmente verificadas.
Hipóteses: decisões reversíveis feitas por falta de informação.
```

Não obrigue o usuário a preencher esse formulário. Extraia do pedido e do ambiente. Pergunte quando a lacuna mudar materialmente o trabalho; decida detalhes reversíveis com bom julgamento.

## Handoff de componente

Entregue nome e propósito, anatomia, props/variantes relevantes, estado com dono definido, teclado/foco, tokens, exemplos de conteúdo e condições de teste. Para design em Figma ou outra ferramenta, preserve relação entre componente visual e componente implementado quando existir.

Especificar “12px de padding” não basta se o texto longo estoura o componente. Inclua comportamento sob restrição e prioridade das ações. Não forneça dezenas de medidas deriváveis do código quando uma regra de layout explica melhor.

## Handoff de página

Liste rota, função, origem dos dados, composição, estados, adaptação e assets necessários. Inclua o que é real, demonstrativo ou não integrado. Um link de preview é útil quando disponível; ele não substitui instrução de execução do projeto quando solicitada.

## Documento vivo e escopo

Use a fonte de verdade existente. Decisões globais vão para tokens ou documentação comum; exceções locais devem ter alcance e motivo. Não crie “master” paralelo se o projeto já tem sistema equivalente. Evite divergência entre documentação, arquivo CSS e componentes reais.

## Registro de evidência

Separe design proposto, código implementado e condições testadas. Um mockup não comprova responsividade; um teste de build não comprova foco. No encerramento, diga o que mudou e o que foi verificado, com limitações materiais. Não transforme falta de dados de conversão em estimativa inventada de resultado comercial.
