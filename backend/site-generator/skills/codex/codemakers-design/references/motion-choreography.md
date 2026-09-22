# Motion design e coreografia

Use quando movimento fizer parte da direção ou da compreensão de estados. Intensidade alta é uma opção criativa, não o padrão de qualidade.

## Vocabulário de movimento

| Função | Recurso possível | Pergunta de aceitação |
|---|---|---|
| Reconhecer ação | Mudança de cor, pressão ou destaque | O feedback aparece sem atrasar a operação? |
| Explicar origem | Painel emerge do acionador ou área relacionada | A relação espacial ajuda a entender o novo estado? |
| Manter continuidade | Objeto preserva identidade entre visões | O usuário acompanha o que mudou? |
| Organizar entrada | Sequência curta por grupos semânticos | O conteúdo importante está disponível imediatamente? |
| Mostrar progresso | Estado medido ou indicador indeterminado | O movimento representa informação verdadeira? |
| Demonstrar produto | Movimento do próprio objeto ou processo | A demonstração explica mais que uma imagem estática? |
| Expressar marca | Um gesto gráfico consistente | O recurso permanece coerente sem atrapalhar controles? |

## Tempo, distância e easing

Duração depende de distância percebida, tamanho do elemento e expectativa. Deslocamentos pequenos precisam de resposta mais curta; painéis maiores podem exigir mais tempo para serem acompanhados. Evite usar a mesma curva elástica em todos os elementos.

Easing de saída rápida costuma ajudar entradas responsivas; saídas podem ser mais curtas. Uma mola pode comunicar materialidade ou continuidade, mas oscilações excessivas atrasam a leitura. Preserve estado final estável e previsível.

Faixas ilustrativas: resposta de pressão 80–160ms, mudança de cor 120–220ms, painel 180–320ms, demonstração narrativa conforme o conteúdo. Não introduza atrasos mínimos artificiais; mudança instantânea pode ser a melhor resposta.

## Coreografia por grupos

Agrupe elementos pela função, não pelo índice de todo nó do DOM. Título, explicação e ação podem entrar como um conjunto; 40 linhas de tabela não precisam de stagger. O tempo total acumulado importa: 20 itens com 100ms de intervalo deixam o último esperando quase dois segundos.

Evite ocultar conteúdo essencial até a pessoa rolar. Se JavaScript, observer ou animação falhar, a página deve continuar utilizável. Prefira aprimoramento progressivo: conteúdo visível por padrão, efeito aplicado quando a execução puder acontecer.

## Receitas

### Hover e pressão

Use alterações pequenas e consistentes. Um card que sobe sugere interatividade; não aplique a cards estáticos. Restrinja efeitos de hover aos dispositivos que o suportam quando necessário. Pressão não deve mover o alvo a ponto de fazê-lo escapar do ponteiro.

### Expansão de conteúdo

Priorize a compreensão do conteúdo revelado. Se animar altura, avalie custo de layout e conteúdo variável. A animação não pode cortar foco ou travar a atualização do tamanho. Em mudanças frequentes e listas densas, expansão direta pode ser mais clara.

### Modal e drawer

Separe apresentação visual de comportamento de foco. A abertura deve tornar conteúdo e foco disponíveis de forma coerente; a saída não pode deixar uma camada invisível bloqueando cliques. Evite escalas grandes que fazem o texto parecer uma imagem ampliada.

### Transição de rota

Mantenha expectativas de navegação, histórico e foco. Animação não deve atrasar URL ou esconder erro de carregamento. A [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) pode apoiar continuidade visual; use detecção de suporte e mantenha atualização normal como fallback. Não presuma compatibilidade de todas as variantes entre navegadores.

### Reordenação e FLIP

Pode preservar identidade entre posições de itens. Meça início/fim quando necessário, inverta visualmente a diferença e anime até a posição final. Evite leituras/escritas de layout intercaladas por item. Preserve foco, ordem semântica e estado; o visual não pode simular uma ordem diferente dos dados.

### Parallax e ambiente

Restrinja a elementos não essenciais, amplitude moderada e condições adequadas. Não vincule a leitura de texto a movimentos contínuos. Pare trabalhos fora de tela e verifique consumo de recursos. Mobile e movimento reduzido precisam de composição estática completa.

### Números e gráficos

Animação deve manter valor final claro, unidades estáveis e leitura acessível. Não anuncie cada frame a leitores de tela. Não anime entre números de modo que pareça medição real durante um estado de carregamento. Atualizações frequentes podem dispensar transição.

## Exemplo CSS de feedback

```css
.action {
  transition: background-color 160ms ease-out, transform 120ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .action:hover { transform: translateY(-1px); }
}
.action:active { transform: translateY(0); }
.action:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .action { transition: none; }
  .action:hover, .action:active { transform: none; }
}
```

O foco é ilustrativo: confira contraste com superfícies adjacentes. A regra não define cores de todos os estados nem semântica do botão.

## Escolha técnica

CSS atende feedback e transições simples. Web Animations pode ajudar com controle imperativo. Uma biblioteca pode valer a pena para coreografia complexa, timelines ou integração já existente. Confirme versão e API antes de copiar exemplos. Não adicione biblioteca só para animar opacity.

Transform e opacity frequentemente reduzem custo de layout, mas não garantem desempenho: sombras, grandes camadas, blur e quantidade de elementos também importam. Meça no dispositivo e na cena relevantes. `will-change` permanente em centenas de nós pode aumentar uso de memória.

## Redução de movimento

Substitua deslocamento por estado estático ou transição mais simples, preservando significado. Não basta acelerar tudo para 1ms se isso quebrar eventos ou lógica. Prefira que o resultado funcional não dependa de `animationend` sem fallback.

## Critique o efeito

Verifique movimento interrompido, reversão rápida, clique repetido, troca de aba, desmontagem de componente e mudança de preferência quando relevantes. Corte efeitos que não expliquem, expressem ou orientem nada. Uma única sequência bem resolvida pode ser suficiente.
