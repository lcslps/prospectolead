# Exemplos completos de raciocínio de projeto

Estes exemplos mostram como aplicar a skill. São exercícios de referência, não projetos executados ou resultados de teste. Dados e marcas hipotéticos devem continuar identificados como demonstração se usados em um protótipo.

## A. Landing de um ateliê de mobiliário

**Pedido:** mostrar peças sob medida e receber pedidos de orçamento. **Contexto:** poucos projetos fotografados e nenhuma métrica comercial fornecida.

**Escolha de direção:** comparar “galeria de peças” com “oficina material”. A galeria favorece apreciação; oficina material explica o trabalho sob medida. Escolher oficina quando processo e personalização forem o diferencial demonstrável.

**Contrato:** visitante reconhece o tipo de peça, vê materiais e exemplos, entende etapas reais e descreve seu pedido. Tipografia com caráter no display e leitura neutra nas especificações. Paleta derivada das fotos, sem tornar cada superfície marrom. Assinatura: desenho de projeto ao lado da peça final, se ambos os assets existirem.

**Estrutura:** abertura com peça em uso e texto concreto; seleção de projetos; material/processo; condições conhecidas; formulário. Sem seção de clientes ou depoimentos inventados. O formulário pede tipo de peça, contexto e contato, apenas se esses dados forem úteis.

**Componentes:** navegação curta, project card com link real, galeria, disclosure para detalhes secundários e formulário. **Mobile:** identificação e ação próximas da imagem; fotos recortadas com foco na peça. **Estados:** carregamento de mídia, projeto sem foto alternativa, formulário inválido, envio e falha preservando texto.

**Verificação planejada:** abrir projeto, percorrer por teclado, submeter dados inválidos/válidos no formato integrado ou demonstrativo autorizado, testar título longo e viewport estreita. **Sinal de falha:** o visitante vê estilo, mas não entende que o serviço é sob medida.

## B. Dashboard de expedição existente

**Pedido:** tornar atrasos mais visíveis sem trocar stack ou identidade. **Contexto:** tabela e filtros já existem.

**Contrato:** operador encontra pedidos que precisam de ação e abre o detalhe mantendo período e filtro. Diferencia prazo, atraso e status da carga. Assinatura de qualidade: alinhamento e contexto preciso, sem necessidade de recurso ornamental.

**Mudança:** manter shell e componentes. Adicionar ou reorganizar indicador de exceção, ordenar informações por decisão e tornar ações claras. Não converter tabela inteira em cards porque parecem modernos. Preservar colunas necessárias para comparação.

**Dados:** período, unidade temporal, atualização e regra de atraso precisam corresponder ao sistema. **Estados:** carregando, sem atrasos, filtro sem resultados, falha e dados desatualizados quando suportados. **Mobile:** colunas prioritárias e detalhe por pedido; rolagem contida se comparação exigir.

**Verificação planejada:** filtro retorna o conjunto correto, detalhe usa o mesmo contexto, voltar preserva posição apropriada e ação por teclado funciona. **Sinal de falha:** indicador destacado mostra um total diferente da tabela por filtro divergente.

## C. Festival com direção visual explícita

**Pedido:** rosa e roxo, tipografia grande e animação expressiva. **Contexto:** programação e assets reais fornecidos.

**Contrato:** respeitar identidade solicitada e facilitar encontrar atrações, datas, local e ingresso. Selecionar gesto gráfico ligado à programação; manter controles estáveis. Não proibir a paleta porque aparece em templates populares.

**Estrutura:** abertura expressiva, agenda pesquisável ou filtrável se volume justificar, detalhes e compra. Hero pode usar tipografia como composição, mas não precisa ocupar toda a altura útil. **Motion:** uma entrada ou transição de cartaz; sem animação em cada linha da agenda.

**Componentes:** filtro por dia com semântica adequada, cards de evento, detail dialog ou rota conforme profundidade. **Redução de movimento:** cartaz estático preserva identidade e toda a informação. **Conteúdo:** não inventar ingressos restantes, popularidade ou artistas.

**Verificação planejada:** localizar atração por dia, abrir detalhe por teclado/toque, voltar sem perda de filtro, verificar contraste sobre as superfícies reais. **Sinal de falha:** o efeito exige esperar para ler horários ou provoca movimento do botão durante clique.

## D. Configurações com autosave

**Pedido:** permitir editar preferências com autosave no app atual. **Contexto:** API e versão dos objetos disponíveis.

**Contrato:** deixar claro o que foi salvo e preservar novas edições durante envios. Visual calmo, grupos por finalidade, descrição da consequência junto à configuração. Não misturar campos com autosave e botão “Salvar tudo” sem regra explícita.

**Estado:** revisão local, revisão enviada e revisão confirmada. Se usuário editar durante a requisição, o retorno confirma apenas o snapshot enviado. Falha mantém alterações e oferece recuperação. Conflito segue mecanismo real do produto.

**Componentes:** switches para preferências imediatas, campos com ajuda e status de salvamento próximo ao grupo. **Mobile:** texto de ajuda não fica cortado; foco mantém o campo visível com teclado virtual.

**Verificação planejada:** duas edições rápidas com respostas fora de ordem, falha e retry, navegação após alteração pendente. **Sinal de falha:** toast “Salvo” aparece enquanto a revisão atual ainda não foi confirmada.

## E. Página de produto com variantes

**Pedido:** página de compra para um produto com tamanhos e cores. **Contexto:** catálogo real define imagem, preço e disponibilidade por variante.

**Contrato:** visitante entende produto, seleciona variante disponível e vê o custo coerente antes de adicionar. Imagem demonstra forma e escala; preço e condições não ficam escondidos abaixo de uma narrativa longa.

**Estrutura:** galeria + resumo de compra; informações de uso; especificações; condições de entrega conhecidas. **Componentes:** radio group ou select para opções, controle de quantidade e ação de compra; escolha depende da quantidade e da necessidade de comparar visualmente.

**Estado:** selecionado, indisponível, recalculando, pronto e falha. Bloquear compra se a variante não estiver resolvida quando necessário; explicar a condição. Carrinho soma quantidade e valores do modelo correto, não apenas texto formatado.

**Verificação planejada:** mudar variante altera imagem/preço/estoque de forma coerente, quantidade recalcula e falha não finge sucesso. **Sinal de falha:** botão compra o ID anterior enquanto a UI já exibe outra cor.

## F. Reprodução de uma referência visual

**Pedido:** implementar fielmente uma screenshot. **Contexto:** uma largura e um estado conhecidos; nenhuma especificação de mobile.

**Contrato:** preservar composição observada, medindo container, proporções, escala de texto e crop. Identificar hipóteses para outras larguras e comportamento. Não usar a oportunidade para trocar paleta ou assinatura.

**Implementação:** construir estrutura antes de detalhes; confirmar fonte ou uma alternativa identificada se o asset faltar. Usar tokens para decisões repetidas. Não posicionar tudo absolutamente para coincidir em uma largura e quebrar com conteúdo real.

**Adaptação:** inferir empilhamento e leitura mantendo relações do original; não afirmar que essa versão mobile foi fornecida. **Verificação planejada:** comparação na largura de referência, quebras, alinhamentos, mídia e estado; depois viewport estreita e conteúdo longo.

**Sinal de falha:** detalhes de sombra estão próximos, mas título, imagem e espaçamento da composição principal divergem muito.

## Como usar os exemplos

Extraia a decisão aplicável e adapte ao pedido atual. Não reutilize setores, nomes ou seções sem motivo. Os exemplos mostram profundidade proporcional: correção operacional preserva sistema; criação aberta desenvolve identidade; reprodução prioriza fidelidade. Todos conectam aparência, comportamento e uma forma concreta de verificar.
