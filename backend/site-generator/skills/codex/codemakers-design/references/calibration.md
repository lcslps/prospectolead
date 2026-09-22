# Casos de calibração

Estes casos são exemplos de decisão e um conjunto de cenários para avaliações futuras. Sua presença não significa que os projetos tenham sido executados ou que a skill tenha vencido um benchmark. Ao avaliar uma versão, registre prompt, contexto, resultado real e limitações separadamente.

## Exemplos de contrato visual

### Ateliê de mobiliário sob medida

Pedido: “Crie uma página para mostrar peças e solicitar orçamento.”

Direção possível: fotografia de processo, títulos proporcionais à escala das peças, detalhes de material junto a cada projeto. Compare isso com uma galeria de projetos antes de escolher: o conteúdo disponível e a intenção comercial decidem.

Contrato: visitantes identificam tipo de peça e materiais, abrem um projeto e enviam um pedido com contexto. A assinatura pode ser a relação entre desenho e peça concluída. Mobile mantém imagens, dimensões e ação próximos. Sem casos reais fornecidos, não inventar clientes; identificar exemplos.

Prova: navegação por projeto, formulário inválido/válido, falha preservando texto, carregamento de mídia e ausência de overflow.

### Painel de expedição

Pedido: “Melhore a visão dos pedidos atrasados em um painel existente.”

Contrato: destacar atraso e próxima ação sem redesenhar a identidade do produto. Preservar filtros e rotas. Assinatura aqui é precisão operacional: tempo, status e contexto alinhados. Densidade pode permanecer alta.

Prova: filtrar atrasados, distinguir ausência de atraso de falha, abrir pedido, voltar sem perder contexto e operar ações por teclado. Não adicionar animação de entrada às linhas a cada atualização.

### Festival com linguagem expressiva

Pedido: “Quero tipografia grande, rosa e roxo, energia e movimento.”

Contrato: respeitar a direção explícita, organizar programação e compra com clareza, escolher um momento expressivo de movimento e manter os demais controles estáveis. Cores populares não são motivo para contrariar o pedido.

Prova: encontrar evento, ler horário/local, acionar compra no formato autorizado, navegar no celular e consumir a mesma informação com movimento reduzido. Não fabricar ingressos restantes.

## Cenários de avaliação

| Cenário | Resultado a observar | Falha relevante |
|---|---|---|
| Site novo com briefing aberto | Assume contexto explícito e cria uma direção coerente com conteúdo e ação | Mesma hero genérica sem relação com assunto |
| Corrigir apenas overflow de um botão | Muda o mínimo, cobre texto longo e largura afetada | Troca de framework, paleta ou layout da página |
| Reproduzir screenshot fornecido | Prioriza medidas e fidelidade, identifica inferências | Redesign imposto como melhoria |
| Marca com fonte e cores obrigatórias | Mantém identidade e resolve pares de contraste no uso | Substitui a marca por preferência própria |
| Dashboard com filtros e zero resultados | Filtros funcionam, estados são distintos, dados são consistentes | Cards e gráficos decorativos sem efeito real |
| Formulário assíncrono que falha | Preserva dados, explica erro e permite recuperação apropriada | Toast de sucesso falso ou limpeza de campos |
| Modal longo no mobile | Conteúdo e ações acessíveis, foco e saída coerentes | Foco atrás do modal ou botão fora do alcance |
| Usuário pede efeito visual intenso | Atende direção com fallback e tarefa preservada | Proibição dogmática ou scroll sequestrado |
| Projeto sem React e sem rede | Reutiliza stack e recursos presentes | Instalações e APIs inexistentes como pré-requisito |
| Texto secundário pequeno em tema escuro | Mede pelo critério de texto normal | Aprova 3:1 por ser secundário |
| Navegador indisponível | Faz verificações possíveis e informa limite | Declara screenshots revisadas ou interação testada |
| Streaming com usuário lendo acima | Não força scroll e diferencia parcial/interrompido | Pula ao fim a cada token e anuncia cada palavra |

## Comparação entre versões, quando solicitada

Use o mesmo prompt, assets, stack, limites e critérios; execute em ambientes isolados. Avalie artefatos reais, de preferência sem revelar qual versão gerou cada um ao avaliador. Compare tarefa concluída, fidelidade, defeitos, legibilidade, estados e manutenção; não apenas a aparência da primeira dobra.

Registre tentativas e variabilidade. Uma única execução bonita não demonstra superioridade geral. Altere a skill em resposta a falhas observadas, com a menor regra útil; não acumule proibições para cada preferência de um avaliador.
