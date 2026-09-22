# Estudo Flying Papers: o cartaz como interface

Base: [MD original fornecido](source-material/flying-papers.txt). Trate seu vocabulário como referência visual contextual; produto, tom e requisitos de entrada pertencem ao projeto atual. Um age gate descrito na fonte não deve ser acrescentado a sites sem essa necessidade.

## A contribuição central

A página é composta como um cartaz: palco cromático contínuo, texto que ocupa espaço como imagem e personagem que interage com as letras. A assinatura depende dessa relação, não apenas de uma fonte grande ou de um fundo roxo.

A ilustração bidimensional estabelece materialidade de impressão: contorno forte, poucas cores e superfícies chapadas. A navegação e a leitura precisam de uma camada menos expressiva para a composição continuar sendo utilizável.

## Gramática observada

| Dimensão | No documento | Tradução útil |
|---|---|---|
| Palco | Violeta `#8584BD` contínuo | Cor estrutural pode unir cenas sem alternar o fundo |
| Tipo principal | ObviouslyVariable pesada, display até 341px | Poucas palavras podem funcionar como forma gráfica |
| Entrelinha display | Aproximadamente 0.80–0.85 | Compressão pode criar bloco, mas exige inspeção de glyphs |
| Cores secundárias | Amarelos, creme, rosa, verde e magenta | Elenco de cores com papéis definidos por cena |
| Geometria | Cards próximos de 6px e ações em pílula | Contraste entre blocos e controles, sem um raio universal |
| Ilustração | Mascote com contorno e preenchimentos planos | Personagem reforça a frase sem substituí-la |
| Microtipografia | Mono e sans pequenas | Uma segunda voz pode organizar metadados |

Nomes de fontes e valores do arquivo são observações. Não comprovam disponibilidade das fontes, adequação a outro idioma ou legibilidade em todas as larguras.

## Composição de uma cena

Comece pela frase que o usuário deve compreender e por uma ação real. Defina a silhueta das palavras e uma área estável para o controle. Depois posicione o personagem para criar relação: apoiar, espiar ou atravessar uma área não essencial da forma.

Não deixe a ilustração cobrir letras que precisam ser lidas. Se o texto for refluído, personagem e headline precisam se reorganizar; coordenadas absolutas ajustadas apenas a uma frase são frágeis. Overlays decorativos não devem interceptar ponteiro ou foco.

Uma cena seguinte pode manter o palco e mudar a escala do objeto ou a posição da frase. Para conteúdo longo, use superfície de leitura menos ruidosa. O princípio é uma ideia dominante por composição, não uma obrigação de preencher exatamente uma altura de viewport.

## Contraste: preserve expressão com papéis corretos

Os pares fornecidos precisam de cuidado:

- Amarelo `#F4ED36` sobre violeta `#8584BD`: aproximadamente **2.820:1**, insuficiente até para o corte de 3:1 de texto grande.
- Creme `#F9F5F2` sobre o mesmo violeta: aproximadamente **3.211:1**, insuficiente para texto normal.
- Tinta `#1A1A1A` sobre violeta: aproximadamente **5.000:1**, um candidato funcional para texto normal nesse fundo opaco.

Use os amarelos e a ilustração como expressão onde não sejam a única informação. Para o título essencial, altere o par, dê uma superfície apropriada ou escolha outra cor de tinta. Para texto pequeno e ações, prefira pares medidos; uma frase “a cor é o conteúdo” não elimina o requisito de leitura.

Se a reprodução estrita for o objetivo, preserve a observação e explique o ajuste necessário à acessibilidade, em vez de declarar que o par original passou.

## Componentes

**Headline-cartaz:** escala fluida, limite de largura e entrelinha testados com conteúdo real. Uma fonte substituta pode precisar de outro peso ou largura. Não copie 341px como mínimo nem 0.8 como regra de corpo.

**Personagem:** asset próprio ou autorizado, com gramática de contorno e preenchimento consistente. Não use o mascote original como identidade automática do cliente.

**Ação de entrada:** a fonte descreve botão creme preenchido e ação amarela contornada, mas também contém uma proibição genérica de preenchimento. Diferencie os dois papéis em vez de aplicar a proibição literalmente. O projeto pode precisar de outro rótulo e nenhuma restrição etária.

**Bloco informativo:** creme com tinta escura pode oferecer respiro para texto. Hierarquia interna deve ser regular, mesmo que a posição externa da composição seja solta.

**Tag mono:** mantenha significado real, como categoria ou data. A entrelinha de 0.8 citada em microtexto pode causar sobreposição; ajuste para leitura em várias linhas.

## Receita adaptada de palco e informação

```css
.poster-scene {
  --poster-stage: #8584bd;
  --poster-ink: #1a1a1a;
  --poster-paper: #f9f5f2;
  position: relative;
  isolation: isolate;
  color: var(--poster-ink);
  background: var(--poster-stage);
  padding: clamp(1rem, 4vw, 4rem);
}
.poster-scene__title {
  font-size: clamp(3rem, 12vw, 15rem);
  font-weight: 900;
  line-height: 0.95;
  overflow-wrap: anywhere;
}
.poster-scene__reading { background: var(--poster-paper); padding: 1.25rem; border-radius: 6px; }
.poster-scene__decoration { pointer-events: none; }
```

Esta receita propõe tinta e entrelinha distintas das versões mais extremas do arquivo para facilitar leitura. O ajuste é deliberado, não uma medição da página de origem. Reavalie `overflow-wrap` e tamanho com o título final; uma quebra manual pode ser útil apenas quando a composição e o idioma a sustentarem.

## Movimento e adaptação

O estilo de cartoon não exige personagens saltando continuamente. A composição estática pode ser suficiente. Se houver movimento, mantenha o alvo da ação estável e a mensagem acessível sem esperar a animação.

No mobile, diminua quantidade de sobreposições, reordene a informação e preserve áreas de toque. O título pode manter presença grande sem ocupar todo o espaço útil. Ao ampliar texto, a cena deve crescer verticalmente, não cortar os controles.

## Transferência e prova

É uma direção útil quando a marca comporta voz expressiva e há conteúdo curto e ilustração coerente. Para formulários complexos ou dados densos, crie áreas de trabalho calmas dentro da linguagem, em vez de transformar cada estado em outro cartaz.

Confira leitura real da frase, contraste das ações, navegação sem ponteiro, texto localizado, sobreposição de ilustração e funcionamento sem assets. A pessoa deve lembrar a ideia e conseguir agir, não apenas lembrar que havia letras enormes.
