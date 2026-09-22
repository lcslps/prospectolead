# Engenharia front-end a serviço do design

## Integre antes de substituir

Identifique framework, versões instaladas, package manager, lockfile, rotas, CSS, tokens, dependências e comandos do projeto. Leia o componente real: nomes como shadcn não garantem a mesma implementação entre repositórios.

Mantenha a stack existente salvo pedido ou necessidade demonstrada. Um HTML estático pode ser suficiente para uma página simples; uma jornada complexa pode justificar framework. Não instale biblioteca de animação ou gráficos para algo que CSS ou dependências existentes resolvem bem.

Consulte documentação oficial correspondente à versão ao depender de APIs ou configurações mutáveis. Não copie comandos `latest` por hábito nem misture configuração Tailwind de versões distintas. Não migre dependências como efeito colateral de estilização.

## Arquitetura proporcional

Separe componentes por responsabilidade e reutilização real. Centralize conteúdo repetido e variantes relevantes; evite tanto uma página monolítica difícil de ajustar quanto dezenas de abstrações sem necessidade.

Mantenha estado perto de quem o usa; derive valores calculáveis em vez de sincronizar cópias. Separe estado de servidor, URL, formulário e apresentação conforme a arquitetura existente. React, Vue, Svelte ou outro framework devem seguir suas convenções reais, sem tradução automática de padrões incompatíveis.

Em aplicações com renderização no servidor, mantenha interatividade nas fronteiras necessárias. Não torne a página inteira client-side apenas para um toggle. Valores dependentes de relógio, aleatoriedade, viewport ou armazenamento local exigem cuidado para evitar divergência de hidratação.

Use chaves estáveis para listas e limpe timers, observers e listeners. Preserve contratos de dados, rotas e eventos ao redesenhar. Não renderize conteúdo não confiável como HTML bruto para economizar trabalho de layout.

## CSS robusto

Prefira seletores de especificidade previsível ou o sistema já adotado. Inspecione cascata, escopo e herança ao encontrar um estilo que não aplica; não acumule `!important` para encobrir a causa.

Evite nomes genéricos que colidem como `.content` em estilos globais. Em sistemas de utilities compiladas, use classes completas ou mapas explícitos quando interpolação dinâmica impedir descoberta. Não duplique tokens entre CSS e JavaScript sem uma fonte de verdade.

Organize camadas de overlays e stacking contexts; números enormes de z-index não corrigem contexto incorreto. Teste `position: sticky` com os containers de rolagem reais.

## Assets e carregamento

Declare dimensões ou `aspect-ratio` para mídia quando possível. Use formatos e tamanhos adequados, `srcset`/`sizes` ou o mecanismo do framework. Carregue mídia fora da área inicial de forma adiada quando apropriado; não aplique lazy loading indiscriminado ao provável elemento LCP.

Preload é reservado a recursos críticos confirmados, não a todas as fontes e imagens. Use fallback e estratégia de font-display apropriados. Evite carregar pesos que não aparecem na página. Compare layout antes e depois da fonte definitiva.

Vídeo precisa de poster, controles ou alternativa conforme o uso. Não faça a página depender de um autoplay que o navegador pode bloquear. Gere gráficos e ilustrações na tecnologia proporcional à complexidade, mantendo alternativas textuais quando comunicam informação.

## Desempenho com evidência

Investigue a causa antes de otimizar: waterfall de rede, mídia pesada, excesso de JavaScript, layout instável, renderização repetida ou trabalho na thread principal. Meça a interação lenta na condição em que ocorre.

Virtualização depende de custo e escala reais, não de um número universal de itens; avalie busca, impressão, foco e acesso antes de adotá-la. Memoização também deve responder a um custo observado. Reduza leituras e escritas alternadas de layout e limite trabalho contínuo de rolagem.

Como referência de boa experiência, Core Web Vitals usa LCP ≤ 2.5s, INP ≤ 200ms e CLS ≤ 0.1 no percentil 75 das visitas, separando classes de dispositivo. Resultados locais são diagnósticos, não prova de distribuição em produção. Consulte as [definições e thresholds do web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds) para a definição vigente.

Não prometa Lighthouse 100 ou aprovação em produção sem dados. Quando medir, registre ambiente, página, condições e limitações. Para um ajuste pequeno sem risco de desempenho, não crie uma campanha de benchmark.

## Verificação e entrega

Use os scripts disponíveis de build, typecheck e lint conforme o escopo. Execute testes existentes pertinentes. Para lógica nova relevante, teste o comportamento observável: validação, filtro, paginação, estados de erro ou persistência, não a presença de uma classe CSS.

Abra a rota real para detectar falhas de asset, navegação, console e hidratação que a compilação não revela. Exercite botões e formulários; o evento disparar sem efeito não é funcionalidade completa.

Se a entrega for um arquivo independente, verifique se abre no ambiente solicitado e se suas dependências são permitidas. Se for uma aplicação, forneça o modo de execução e preview disponível. Não confunda servidor local iniciado com publicação; publicar ou alterar serviço externo depende do pedido e da autorização aplicável.
