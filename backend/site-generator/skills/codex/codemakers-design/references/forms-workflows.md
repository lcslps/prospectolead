# Formulários e jornadas complexas

Leia quando entrada de dados, persistência, confirmação ou múltiplas etapas forem centrais. Complemente com [Catálogo de componentes](component-cookbook.md).

## Arquitetura de formulário

Agrupe campos pela decisão do usuário, não pela tabela do banco de dados. Ordene dependências: país antes de formato regional, tipo de entrega antes de endereço condicional. Uma pergunta deve deixar claro por que a resposta importa quando isso não for evidente.

Use uma coluna como ponto de partida para leitura sequencial. Duas colunas podem funcionar para pares fortemente relacionados, como mês/ano ou cidade/estado, quando os rótulos e a largura permitirem. Não crie zigue-zague difícil só para reduzir altura.

## Obrigatório, opcional e formato

Adote uma convenção consistente. Quando quase tudo for obrigatório, destacar opcionais pode reduzir ruído. Informe formatos que não forem reconhecíveis; máscaras devem ajudar sem impedir colagem, edição, teclado ou formatos válidos.

Não rejeite nome, telefone ou endereço com regra inventada. Derive validações do contrato real. Valor formatado para exibição e valor enviado ao backend podem diferir; mantenha a conversão explícita e teste o locale relevante.

## Momento da validação

Use validação imediata para feedback útil e pouco ambíguo, como contador de limite ou confirmação de formato após uma ação. Evite mostrar erro no primeiro caractere digitado. Após submissão falhar, revalidar o campo corrigido pode ajudar sem exigir novo envio de todo o formulário.

Erros do servidor podem ser de campo, de regra entre campos ou gerais. Mostre no nível correto. Mensagem “algo deu errado” não deve substituir detalhe disponível que a pessoa possa usar para corrigir.

## Máquina de estados de submissão

```text
editing -> validating -> submitting -> saved
              |              |
              v              v
        invalid fields    failed request
              |              |
              +-> editing <--+
```

Enquanto envia, impeça submissão duplicada pertinente, mantenha feedback e preserve entradas. Se houver cancelamento de rede, não assuma que isso desfez uma mutação já recebida pelo servidor. Em operações importantes, estado final deve vir de confirmação real ou reconciliação.

## Autosave

Defina quando salva, quais campos fazem parte da operação, como versões são conciliadas e como falha é recuperada. “Salvo” deve representar confirmação, não apenas um timer.

Estados úteis: sem alteração, alterado, salvando, salvo, falhou e conflito. Ao editar durante um envio, uma resposta antiga não pode marcar a versão nova como salva. Guarde identificação de revisão ou snapshot equivalente conforme arquitetura. Não use debounce como substituto de controle de concorrência.

## Multi-step

Divida quando as etapas representarem decisões compreensíveis ou reduzirem carga relevante. Preserve entradas ao voltar. Ramificações precisam recalcular sequência e descartar dados incompatíveis com consciência; não envie campos ocultos que contradizem escolhas atuais.

Ofereça revisão antes de confirmação com consequência quando apropriado. Permita editar uma seção sem recomeçar. Mostre progresso honesto: nome da etapa pode ser melhor que porcentagem inventada.

## Dados sensíveis e confirmação

Não crie campos além do necessário ao objetivo. Mostre somente o contexto que ajuda a evitar erro. Ao confirmar exclusão ou envio, identifique o objeto e a consequência concreta. Não faça confirmação genérica que exige lembrar qual item estava selecionado.

Undo é útil quando tecnicamente real. Se a ação não puder ser desfeita, não prometa desfazer visualmente. Evite confirmação extra para mudanças triviais reversíveis.

## Concorrência e sessões

Considere respostas fora de ordem, conexão perdida e edição por outra pessoa quando o produto exigir. Não sobrescreva silenciosamente uma versão mais nova. Ofereça comparar ou recarregar de forma compreensível quando houver suporte real.

Sessão expirada deve preservar trabalho quando possível e permitir retomar após autenticação. Não mostre um login embutido que perde todo o estado sem explicar consequência. Essas capacidades dependem do sistema; um protótipo deve delimitar simulação.

## Cenários de prova

Teste dados válidos, inválidos, envio duplo, falha de servidor, retorno a etapa anterior e edição durante uma operação. Acrescente locale, teclado virtual ou concorrência se afetarem o fluxo. Verifique que mensagens e controles refletem o estado real, inclusive depois de uma recuperação.

Em um formulário simples, isso não exige construir uma plataforma de testes: exercitar os estados pertinentes e registrar a evidência é suficiente. Em lógica complexa, use testes de comportamento para impedir regressão.
