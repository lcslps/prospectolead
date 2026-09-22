# Catálogo de componentes: decisões e estados

Use como contrato de implementação. Reutilize primitivas do projeto e consulte [Interação e acessibilidade](interaction-accessibility.md) para modelos de teclado. Os itens descrevem requisitos de produto; não substituem a documentação da biblioteca escolhida.

## Ações e navegação

### 1. Botão

Rótulo comunica o efeito, variante expressa intenção e tamanho corresponde ao contexto. Implemente repouso, hover, active, foco e estados indisponíveis aplicáveis. Carregamento preserva tamanho e nome acessível; desabilitação precisa impedir ação na lógica. Use `type="button"` para ações que não submetem um formulário.

### 2. Link

Deve apontar para destino real e manter comportamentos de navegação como abrir em nova aba quando apropriado. Diferencie links dentro de texto sem depender somente de cor quando necessário. Não use `href="#"` como substituto de botão ou destino ainda inexistente.

### 3. Botão somente com ícone

Forneça nome acessível e área de interação adequada sem distorcer o ícone. A ação deve ser reconhecível no contexto; tooltip ajuda, mas não substitui o nome. “Mais opções do pedido 1042” é melhor que dezenas de botões chamados “Mais”.

### 4. Grupo de ações e split button

Agrupe comandos relacionados e mantenha a ação principal independente do menu secundário. Não faça o mesmo clique abrir menu e executar ação. Diferencie visualmente e por nome os dois alvos. Em pouco espaço, priorize comandos usados e mantenha descoberta dos demais.

### 5. Navegação global

Indique destino atual, mantenha nomes consistentes e preserve estrutura em rotas internas. Navegação de site normalmente usa links e listas, não comportamento de menu de aplicação. No mobile, o botão que expande deve refletir o estado real e o conteúdo fechado não deve continuar recebendo foco.

### 6. Breadcrumb

Representa posição hierárquica, não histórico arbitrário. Itens intermediários navegam; item atual pode ser texto. Use nomes úteis em vez de IDs internos. Em caminhos longos, truncamento precisa preservar contexto e acesso aos níveis ocultos.

### 7. Tabs

Use para painéis associados dentro do mesmo contexto, não automaticamente para toda navegação entre páginas. Nome, painel selecionado, foco e setas precisam seguir a primitiva usada. Ativação automática só é agradável quando o painel aparece sem latência relevante; caso contrário, ativação explícita pode ser melhor.

### 8. Accordion ou disclosure

Pergunta/título claro e acionador independente. Expansão precisa preservar compreensão da página; não esconda a informação mais importante apenas para diminuir altura. Defina se vários itens podem permanecer abertos. Use `<details>` quando o comportamento nativo atender ao caso.

## Entrada e seleção

### 9. Campo de texto

Label visível, valor, exemplo opcional e ajuda com propósito distinto. Reserve espaço de erro apenas quando melhorar estabilidade sem deixar o formulário artificialmente espaçado. Não remova o texto digitado ao receber erro de rede. Indicadores de obrigatório/opcional precisam ser consistentes.

### 10. Textarea e editor

Defina tamanho inicial, expansão e limites reais. Contador de caracteres é útil perto de um limite relevante, não como decoração. Editor rico precisa de comandos acessíveis e formato de saída claro. Não substitua textarea por contenteditable sem necessidade e tratamento correspondente.

### 11. Select

Bom para conjunto conhecido de opções quando busca não é necessária. Prefira controle nativo se a personalização não trouxer benefício suficiente. Placeholder não deve ser confundido com opção válida. Em listas longas ou heterogêneas, considere combobox com busca.

### 12. Combobox e autocomplete

Esclareça se aceita valor livre ou apenas itens existentes. Trate lista aberta, carregando, nenhum resultado, opção ativa e seleção. Digitação, setas, Enter e Escape precisam de comportamento consistente. Resultados atrasados não podem substituir a consulta atual. Reutilize primitiva testada; um input e um dropdown não implementam o padrão sozinhos.

### 13. Checkbox

Serve a escolhas independentes; label deve ser acionável. Estado parcial precisa ser real e anunciado em seleção de grupos. Ao marcar “selecionar todos”, exponha o escopo. Não use checkbox para acionar imediatamente uma operação que deveria ser um comando explícito.

### 14. Radio group

Serve a escolhas mutuamente exclusivas. Agrupe sob uma pergunta ou legenda e mantenha descrições próximas. Um card selecionável pode conter radio, mas não deve engolir links ou controles internos. Não use cor como único sinal de seleção.

### 15. Switch

Adequado a configuração binária com efeito compreensível. O label nomeia a configuração, mantendo significado nos dois estados. Se depende de salvar posteriormente, deixe isso claro no formulário; se a alteração é imediata, represente falha e restauração. Não anuncie como concluída uma requisição ainda pendente.

### 16. Controle segmentado

Defina se representa escolha de valor, tabs ou navegação. Use semântica correspondente, sem misturar modelos. Poucas opções curtas funcionam melhor; em espaço pequeno, não comprima rótulos a ponto de perder significado. Mantenha seleção visível além de mudança sutil de cor.

### 17. Slider

Bom para explorar valores contínuos ou uma faixa perceptiva. Valores exatos podem exigir entrada numérica complementar. Mostre unidade, mínimo, máximo e passo relevantes. Garanta teclado e nome acessível. Dois polegares exigem distinguir mínimo/máximo e evitar cruzamento ambíguo.

### 18. Seletor de data e intervalo

Permita digitação quando apropriado, comunique formato e trate datas indisponíveis. Intervalos precisam de início/fim, ordem válida e contexto de fuso quando pertinente. Não force navegação por centenas de meses para data de nascimento. A tabela de calendário precisa de modelo de teclado específico.

### 19. Upload

Disponibilize botão além de arrastar. Informe formatos e limites reais antes do envio. Diferencie arquivo selecionado, carregando, processando, pronto e falhou. Cancelar, tentar novamente e remover devem preservar os demais arquivos. Validação do cliente não substitui validação de backend.

### 20. Campo de busca

Use label ou nome acessível, consulta persistente e ação de limpar reconhecível. Determine se a busca é imediata ou submetida. Ao limpar, mantenha foco em lugar útil e atualize resultados. Atalho de teclado pode complementar, nunca substituir descoberta.

## Superfícies e informação

### 21. Card

Agrupa um objeto ou uma unidade de conteúdo. Não é obrigatório para cada seção. Se o card navega, prefira um link principal claro e evite aninhar botões dentro de links. Estados de hover não podem sugerir clique onde não há ação. Conteúdo variável precisa de hierarquia estável.

### 22. Lista e item

Organize título, metadados, status e ação pela tarefa. Comparações pedem alinhamento entre itens. Separadores não devem competir com conteúdo. Diferencie selecionado de focalizado; uma lista clicável não vira `listbox` automaticamente.

### 23. Tabela

Defina colunas pela comparação exigida. Texto tende a alinhar ao início; números comparáveis ao fim. Use cabeçalhos, unidades, ordenação e escopo de seleção. Em telas pequenas, escolha rolagem contida, colunas prioritárias ou detalhe por linha; preserve dados essenciais. Exporte apenas quando o fluxo realmente implementar exportação.

### 24. Paginação

Mostre posição e quantidade quando conhecidas. Não ofereça “última página” se o backend só fornece cursor sem total. Alterar filtros normalmente volta à primeira página; mantenha a escolha de tamanho quando útil. Controles indisponíveis precisam de estado coerente e navegação não pode perder foco silenciosamente.

### 25. Badge e chip

Badge comunica categoria ou status; chip pode representar filtro ou seleção removível. Não faça um badge parecer botão sem ação. Para filtro removível, nomeie a remoção e preserve área de toque. Status pede texto, não só ponto colorido.

### 26. Tooltip

Oferece informação complementar curta. Não coloque ações, instrução essencial ou parágrafos longos em tooltip. Precisa estar disponível por foco e comportar-se sem cobrir o acionador de forma problemática. Use outro padrão quando o conteúdo precisar de interação.

### 27. Popover

Serve a interação contextual compacta. Defina abertura, saída, foco e comportamento fora do painel; não suponha que todo popover deve prender foco. Reposicione em relação às bordas e ao teclado virtual. Conteúdo grande ou tarefa complexa pode pedir dialog ou página.

### 28. Dialog e drawer modal

Nome claro, propósito delimitado, foco apropriado e fechamento previsível. Conteúdo de fundo inativo; ações alcançáveis com texto longo. Um drawer visual não obriga modalidade. Confirme retorno do foco e estado após cancelamento, sucesso e erro.

## Feedback e operação

### 29. Alert inline

Mensagem durável junto ao contexto que precisa de atenção. Mostre causa conhecida e recuperação útil. Não duplique a mesma mensagem em banner, toast e campo sem razão. Severidade visual deve corresponder à consequência, não à urgência comercial.

### 30. Toast

Útil para confirmação breve não bloqueante. Não seja o único registro de erro que exige ação posterior. Se houver “Desfazer”, mantenha disponibilidade suficiente e caminho alternativo quando necessário. Evite pilhas que cobrem os controles e anúncios duplicados.

### 31. Skeleton, spinner e progresso

Escolha pela operação e pelo que se sabe. Skeleton antecipa layout; spinner indica espera indeterminada; barra percentual exige progresso medido. Não mostrar skeleton vazio por tempo artificial. Mantenha informação e alternativa de recuperação se a espera falhar.

### 32. Estado vazio

Explique se é primeiro uso, ausência de dados, filtro restritivo ou problema. Dê um próximo passo compatível: criar primeiro item, limpar filtros, importar dados ou tentar novamente. Ilustração pode apoiar, mas não substituir explicação. Não chamar erro de “nenhum registro”.

### 33. Command palette

Boa para usuários frequentes com muitos comandos. Ofereça descoberta por navegação normal, busca tolerante e agrupamentos úteis. Diferencie comandos, destinos e resultados. Atalhos não podem conflitar com recursos essenciais do navegador ou tecnologias assistivas.

### 34. Kanban e arrastar

Colunas devem representar estados reais; mudança precisa preservar consistência de dados. Ofereça alternativa para mover sem arrastar. Exponha sucesso e falha; rollback não deve produzir perda silenciosa. Colunas cheias, longas ou vazias precisam continuar utilizáveis no mobile.

### 35. Árvore de navegação

Só use árvore quando a hierarquia for relevante e explorável. Diferencie expandir de selecionar. Carregamento por ramo precisa manter posição e estado. O modelo de teclado é mais complexo que uma lista de links; use biblioteca apropriada ou uma estrutura mais simples.

### 36. Gráfico interativo

Escolha pela pergunta e disponibilize resumo ou dados equivalentes. Legenda, unidade e filtro próximos. Seleção de série deve ser reversível, e tooltip precisa de alternativa de acesso. Não use uma animação para ocultar dados inconsistentes.

## Como transformar o catálogo em implementação

Escolha somente componentes necessários à jornada. Para cada um, descreva semântica, anatomia, variantes, estados, conteúdo extremo e condição de verificação. Comece pela ação principal e seus estados difíceis; depois ajuste o acabamento compartilhado. Não construa uma biblioteca de 36 componentes quando a tarefa pede três.
