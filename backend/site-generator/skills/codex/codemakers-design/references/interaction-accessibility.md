# Interação e acessibilidade

Use os critérios abaixo para construir e verificar, não para declarar certificação. Ferramentas automáticas cobrem parte dos problemas. A implementação e a jornada precisam de verificação no contexto real.

## Semântica e teclado

Use links para navegação e botões para ações. HTML nativo reduz a quantidade de comportamento a reimplementar. ARIA complementa semântica; adicionar `role` não implementa teclado nem foco.

Mantenha nomes acessíveis claros, labels visíveis em campos e estados expandidos/selecionados coerentes. Preserve ordem lógica e não use `tabindex` positivo para corrigir layout. Ofereça alternativa às ações só disponíveis por arrastar, hover ou gesto. Conteúdo decorativo deve ser ignorável por tecnologia assistiva.

Confira foco visível no contexto, inclusive sobre imagens e superfícies adjacentes. Não remova outline sem alternativa. Cabeçalhos fixos e overlays não podem encobrir o elemento focalizado. Use skip link em páginas com navegação repetitiva substancial.

## Critérios quantitativos: não misture categorias

| Critério | Referência e aplicação |
|---|---|
| Texto normal | Contraste mínimo AA de 4.5:1, incluindo texto secundário informativo |
| Texto grande | 3:1; a classificação é pelo tamanho/peso, não pela importância do conteúdo: pelo menos 18pt, ou 14pt em negrito, aproximadamente 24px ou 18.67px em CSS |
| Informação não textual necessária | 3:1 contra cores adjacentes para identificar controles/estados e gráficos, conforme aplicação e exceções do critério |
| Alvo de ponteiro | WCAG 2.2 AA prevê 24×24 CSS px ou satisfação de uma exceção, como espaçamento; não confundir com uma regra universal de 44px |
| Conforto de toque | Prefira áreas próximas de 44–48 CSS px em controles de toque frequentes quando viável; é uma recomendação de usabilidade, não o mínimo AA universal |
| Reflow | Verifique apresentação equivalente a 320 CSS px de largura sem rolagem em duas direções, salvo conteúdo que exija layout bidimensional |

Contraste é avaliado com a razão não arredondada: 4.499 não passa em 4.5. Inatividade e logotipos têm exceções no critério de texto; isso não torna “texto secundário” uma exceção. Não aplique um único corte de contraste a todo pixel decorativo.

Fontes: [contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [tamanho de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

O script [contrast_check.py](../scripts/contrast_check.py) calcula pares sRGB opacos. Não resolve composição de alpha, fundo com fotografia, gradiente nem recorte de foco. Nessas situações, avalie as cores efetivas e os pontos de menor contraste com ferramenta adequada. O modo `large` depende da classificação manual correta do texto; o modo `non-text` não avalia as exceções do critério.

## Formulários e recuperação

Associe labels a controles e ajuda/erro ao campo. Placeholder oferece exemplo, não substitui label. Agrupe escolhas relacionadas com estruturas semânticas apropriadas. Configure `type`, `autocomplete` e `inputmode` quando pertinentes.

Valide no momento que ajuda: não apresente erro antes de a pessoa ter chance de preencher. Na submissão malsucedida, torne erros descobríveis, preserve entradas e mova foco para um resumo ou primeiro erro conforme extensão do formulário. Use `aria-invalid` coerente e não anuncie repetidamente a cada tecla.

Evite submit desabilitado sem explicação. Quando for necessário impedir duplicação durante envio, mantenha feedback e trate repetição também na lógica. Estados `aria-disabled` requerem prevenção real da ação e implementação consciente do comportamento.

Operações destrutivas precisam de consequência clara e recuperação quando possível. Confirmação adicional deve ser proporcional à consequência; não interrompa cada ação reversível com modal.

## Dialogs, menus e disclosures

Para modal, use primitiva confiável e verifique nome acessível, foco inicial apropriado, navegação contida, conteúdo de fundo inativo, saída previsível e retorno de foco ao acionador ou próximo ponto lógico. Conteúdo longo precisa caber e rolar com acesso às ações.

Não coloque foco inicial automaticamente na ação destrutiva. Não confunda drawer visual com modal obrigatório; determine se a interação realmente bloqueia o restante da página. Popover não é automaticamente dialog e navegação de site não precisa virar um menu ARIA.

Tabs, menus e comboboxes têm modelos de teclado próprios. Reutilize primitivas e confirme o padrão correspondente nas [práticas WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/). Para modais, consulte o [padrão de dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Usar uma biblioteca não garante acessibilidade da composição final.

## Assincronismo e feedback

Modele transições reais: estado inicial → carregando → sucesso, vazio ou erro. Preserve conteúdo anterior quando for mais útil que apagar toda a tela, mas sinalize atualização ou desatualização. Não confunda carregando com lista vazia.

Mostre feedback inicial sem atraso artificial. Use spinner em operação pequena indeterminada; skeleton pode ajudar quando o layout esperado é conhecido; progresso numérico só quando mensurável. Reserve espaço para evitar saltos.

Anuncie resultados relevantes com regiões de status apropriadas e parcimônia. Não use alertas assertivos para toda notificação. Se uma requisição falhar, permita tentar novamente quando seguro; retry não deve repetir mutações cegamente.

Em atualização otimista, tenha plano de rollback e mensagem de falha. Resultados antigos não devem substituir filtros ou buscas atuais. Fechar um componente deve limpar listeners e trabalhos associados quando necessário.

## Movimento

Antes de animar, defina a função: feedback, continuidade espacial, hierarquia ou demonstração. Uma mudança instantânea é válida; não imponha duração mínima a toda ação.

Como faixa de trabalho ajustável, feedback curto pode usar cerca de 120–220ms e transições de superfície 180–320ms. Distância, dispositivo e linguagem do produto determinam o valor final. Prefira transform e opacity quando apropriados e evite trabalho caro a cada frame.

Respeite `prefers-reduced-motion`. Remova ou simplifique parallax, zoom, rolagem animada e movimento ambiente mantendo feedback e conteúdo. Não deixe conteúdo inicialmente invisível se uma animação não executar. Evite scroll hijacking e mecanismos que alteram o comportamento esperado da rolagem.

Elementos em movimento persistente podem precisar de controle de pausa; avalie o critério aplicável. Não use piscadas rápidas. Um cursor personalizado ou efeito 3D nunca deve ser necessário para completar a tarefa.

## Verificação manual mínima pertinente

Percorra a jornada por teclado. Teste zoom, texto longo e movimento reduzido quando afetados. Inspecione nome, papel e estado dos controles. Em composição complexa, use um leitor de tela disponível; se não houver, descreva que essa parte não foi testada. Não equipare screenshot, árvore de acessibilidade ou ausência de alertas automáticos a teste real com leitor de tela.
