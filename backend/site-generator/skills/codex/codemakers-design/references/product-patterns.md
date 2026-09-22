# Padrões de produto e conteúdo

## Landing page e serviços

Organize pela decisão do visitante: reconhecer oferta, entender benefício concreto, avaliar evidência, resolver objeção e agir. A ordem depende da intenção; visitantes decididos podem precisar de preço ou agendamento imediatamente.

Mostre conteúdo específico. CTA deve dizer o próximo passo: “Agendar demonstração”, “Ver apartamentos”, “Criar projeto”. Repetir a mesma ação em pontos pertinentes pode ajudar; não imponha uma única ocorrência por página.

Não fabrique avaliações, clientes, números ou selos. Sem prova fornecida, use demonstração factual, processo ou exemplo identificado. FAQ resolve dúvidas, não preenche template.

Para leads, peça dados úteis ao próximo passo, explique o resultado do envio e preserve texto após falhas. Integração de email ou CRM só está pronta quando existir.

## Dashboard e trabalho operacional

Comece pela decisão: o que precisa de atenção, comparação ou ação? Se todo indicador tiver a mesma importância visual, a hierarquia está incompleta.

- Mostre período, unidade, fuso relevante, atualização e escopo perto dos dados.
- Diferencie sem registros, nenhum resultado para o filtro, carregando, acesso restrito e falha.
- Preserve filtros na URL quando compartilhamento, atualização e Voltar precisarem reproduzir a visão.
- Conecte resumo a detalhe quando a tarefa exigir investigação.
- Densidade significa informação útil por área, não redução indiscriminada de fonte e toque.
- Tabelas precisam de cabeçalhos, ordenação clara, seleção inequívoca e ações identificáveis. Não use `grid` ARIA sem implementar seu modelo de teclado.
- Em ações em lote, esclareça se a seleção vale para a página atual ou todos os resultados.

No mobile, priorize campos, ofereça detalhes por linha ou rolagem horizontal contida e identificável quando a comparação tabular exigir. Não esconda dados críticos silenciosamente nem force cartões que destruam comparação.

## Gráficos: escolha pela pergunta

| Pergunta | Ponto de partida | Cuidado |
|---|---|---|
| Qual categoria é maior? | Barras ou pontos alinhados | Barras normalmente começam em zero; unidades e ordem explícitas |
| Como varia no tempo? | Linha com eixo temporal real | Preserve intervalos e lacunas; ausência não é medição |
| Como valores se distribuem? | Histograma ou pontos; box plot se compreensível | Declare agrupamento e amostra relevantes |
| Duas medidas se relacionam? | Dispersão | Relação não prova causalidade; identifique eixos |
| Qual parte de um total? | Barra empilhada ou comparação direta | Verifique se partes somam o total |
| Onde ocorre? | Mapa quando localização importa | Barras podem comparar magnitudes melhor |
| Quanto falta para a meta? | Valor, referência e progresso | Meta não é previsão; não invente denominador |

Inclua resumo textual ou tabela acessível. Tooltips precisam de alternativa para teclado e toque. Combine cor com rótulos, traços ou símbolos. Evite 3D que distorce magnitude e animação que impede leitura. Não atribua melhora de negócio ao redesign sem medição.

## SaaS, configurações e formulários

Organize navegação por objetos e tarefas reconhecidos. Separe destinos de comandos. Defina como encontrar, criar, editar, salvar e retornar ao objeto.

Use divulgação progressiva para opções avançadas sem impedir descoberta. Diferencie salvar explicitamente de autosave; mostre salvando, salvo e falha de acordo com o comportamento real. Considere a expectativa da jornada antes de descartar edições ao fechar painéis.

Onboarding deve levar ao primeiro resultado útil. Não crie um tour longo para algo explicável no estado vazio. Explique indisponibilidade quando isso ajudar a progredir; cor de controle não substitui permissões reais.

## E-commerce e checkout

Torne comparáveis produto, variante, preço, quantidade e disponibilidade. Carrinho deve recalcular totais e permitir correções. Exiba custos conhecidos e explique quando frete ou impostos serão calculados.

Não use urgência fabricada, extras pré-selecionados ou obstáculos artificiais ao cancelamento. Não invente pagamento integrado; identifique demonstrações. Use autocomplete e formatos adequados ao país. Preserve dados após falhas. Compra e outras mutações reais continuam sujeitas à autorização aplicável à tarefa.

## Portfólio, catálogo e publicação

Permita descobrir trabalhos sem hover obrigatório. Nome, categoria e contexto devem permanecer disponíveis no toque. Cases relacionam desafio, contribuição, processo relevante e resultado comprovável, sem conquistas inventadas.

Conteúdo longo precisa de medida legível, hierarquia e referências acessíveis. Use sumário quando justificar. Navegação fixa não deve cobrir títulos ou foco. Preserve proporções diversas de mídia.

## Busca e descoberta

Deixe claros consulta, filtros ativos, quantidade e forma de limpar restrições. Preserve o texto digitado. Em zero resultados, diferencie ausência de erro de rede e sugira recuperação pertinente.

Use debounce quando operação e custo justificarem; não atrase a resposta visual do campo. Evite que resultados antigos sobrescrevam uma consulta nova. Submissão explícita pode ser mais previsível em buscas complexas.

## Interfaces com IA

Mostre estado real: aguardando, gerando, concluído, interrompido ou falhou. Quando útil, permita parar e tentar novamente, preservando pedido e resultado parcial. Não use percentual fictício para duração desconhecida.

Diferencie sugestão de alteração aplicada. Permita inspecionar antes de ações com consequências quando a jornada exigir. Fontes precisam existir e sustentar o conteúdo. Não invente raciocínio interno para explicar espera; use mensagens operacionais.

Durante streaming, não force rolagem se o usuário lê acima. Agregue anúncios para leitor de tela em vez de anunciar cada token. Ofereça espera visual contida e alternativa com movimento reduzido.

## Microcopy e localização

Use verbo + objeto; mantenha nomes consistentes entre ação e resultado. Erro informa problema e recuperação: “Não foi possível salvar. Suas alterações continuam aqui. Tente novamente.”

Evite culpa, jargão de backend e rótulos vagos. Exponha termos técnicos quando fizerem parte da tarefa do público.

Formate moedas, números e datas com internacionalização e locale do produto. Não assuma idioma ou país pelo diretório. Teste nomes longos, acentos, pluralização e expansão; em RTL, use propriedades lógicas e respeite direção do conteúdo.
