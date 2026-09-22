# Estudo Slush: uma colagem com controles estáveis

Base: [MD original fornecido](source-material/slush.txt). A identidade de adesivos e fitas é uma referência do recorte fornecido, não evidência de que uma experiência 3D em tempo real seja necessária.

## A contribuição central

O estilo reúne objetos com materialidade distinta: tipografia pesada, fitas infláveis em volume e adesivos planos com contorno. O fundo pastel amarra a composição enquanto um motivo recorrente mantém reconhecimento entre as seções.

A lição não é espalhar objetos aleatórios. Uma colagem precisa de hierarquia, silhueta principal, intervalos e consistência de materiais. Elementos decorativos podem sair do alinhamento; navegação, ações e leitura continuam organizados.

## Gramática observada

| Dimensão | No documento | Decisão transferível |
|---|---|---|
| Fundo | Azul claro `#DCEEFF`, branco e cinza | Campos grandes separam cenas sem molduras adicionais |
| Motivo | Fita tubular `#4DA2FF` com textura | Um asset recorrente pode unir vários capítulos |
| Elenco decorativo | Verde, lilás, laranja, amarelo e violeta | Paleta de objetos não precisa ser a paleta de estados |
| Tipo | Display pesado, cerca de 200–640px no recorte | Texto pode participar da composição como volume gráfico |
| UI | Pílulas e contorno preto | Controles mantêm gramática repetível em cenas soltas |
| Cards | Raios aproximados de 20–40px | Superfícies suaves conversam com o motivo inflável |
| Movimento | Marquee; renders e adesivos descritos como estáticos | Aparência de volume não implica animação contínua |

## Camadas com funções diferentes

1. **Palco:** fundo e transição entre capítulos.
2. **Mensagem:** título e explicação acessíveis como texto.
3. **Motivo:** fita ou objeto que organiza o olhar.
4. **Acentos:** poucos adesivos que complementam a ideia da cena.
5. **Operação:** navegação e CTA em posição previsível, sem deslocamento decorativo.

Evite uma camada de decoração sobre os alvos. Controle stacking context localmente e retire eventos de ponteiro apenas de elementos puramente decorativos. Um asset informativo precisa de equivalente ou descrição apropriada.

## Planejar uma colagem

Defina o contorno principal do título e a direção da fita. Reserve uma região de baixo ruído para explicação e ações. Posicione adesivos com relações claras: escala, repetição de material e vínculo com o assunto. Rotação aleatória de todos os cards não cria coerência.

Planeje uma versão reduzida da cena para mobile. Alguns adesivos podem ser removidos se forem decoração; informação e ações não. A fita pode mudar de posição, crop ou escala, mantendo identidade sem atravessar palavras essenciais.

## Tipografia escultórica sem perder o texto

O arquivo cita entrelinha de 0.75–0.80. Essa compressão depende da fonte e das palavras observadas. Acentos, descendentes e múltiplas linhas podem se sobrepor. Trate display como uma composição específica e mantenha corpo e controles em escala própria.

Valores de até 640px indicam um efeito observado em um contexto amplo. Não crie uma largura mínima de 1280px para o documento como solução. Em telas estreitas, reorganize o título e reduza sua escala, permitindo crescimento vertical.

## Cor de marca e cor de ação

O azul da fita não é automaticamente o azul do botão. Branco sobre `#4DA2FF` oferece cerca de **2.649:1** no par opaco; não serve como padrão de texto branco em ação normal. Branco sobre o violeta `#5C4ADE` oferece cerca de **6.018:1**, mas sua aplicação ainda depende do papel desejado.

A referência chama a ação principal de preta no catálogo de componentes e depois de branca em um exemplo. Para a adaptação, escolha uma regra por hierarquia: preto preenchido para a ação principal e branco contornado para a secundária é uma resolução coerente com a descrição inicial. Registre que a fonte é contraditória; não afirme que a escolha foi confirmada no site.

Verde e amarelo podem ser cores de adesivo sem significar sucesso ou aviso. Quando houver estados de produto, combine texto, forma e papéis semânticos claros.

## Componentes

**Pílulas de navegação:** repetição de forma ajuda a estabilizar a interface. Não transforme todos os destinos em CTAs de mesma ênfase. Rótulos, foco e áreas de interação permanecem legíveis.

**Botão de menu com “+”:** precisa de nome claro, estado expandido e comportamento de abertura/fechamento. O símbolo visual sozinho não explica necessariamente navegação.

**Download e QR:** QR code deve levar a um destino real e ser escaneável, com margem livre e contraste apropriados. Ofereça link ou botão equivalente para a pessoa que está no próprio celular; não use um QR fictício como prova de download integrado.

**Marquee:** não pode ser a única forma de ler uma informação importante. Se houver rolagem persistente, disponibilize pausa quando aplicável e uma alternativa estática com movimento reduzido. Não duplique mensagens para leitores de tela a cada repetição visual.

## Receita adaptada de cena

```css
.sticker-scene { position: relative; isolation: isolate; background: #dceeff; color: #000000; }
.sticker-scene__content { position: relative; z-index: 1; padding: clamp(1.25rem, 4vw, 4rem); }
.sticker-scene__title { font-size: clamp(3.5rem, 15vw, 18rem); font-weight: 800; line-height: 0.95; }
.sticker-scene__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.sticker-scene__action { border: 1px solid #000000; border-radius: 9999px; padding: 0.75rem 1rem; }
.sticker-scene__action--primary { color: #ffffff; background: #000000; }
.sticker-scene__action--secondary { color: #000000; background: #ffffff; }
.sticker-scene__decoration { pointer-events: none; }
```

A receita não gera uma fita 3D nem define toda a UI. Os assets devem ser apropriados e a decoração organizada sem interceptar a tarefa. A entrelinha menos comprimida é uma escolha inicial de adaptação, sujeita à avaliação do título final.

## Transferência e prova

Funciona para experiências lúdicas, campanhas e produtos com uma identidade visual própria capaz de sustentar o elenco de objetos. Não importe carteiras, moedas, foguetes ou mensagens de investimento se o assunto do cliente for outro.

Teste descoberta da ação principal, contraste real, frase com acentos, versão estreita, teclado, download real e página sem animação. A colagem deve parecer intencional mesmo com um número menor de elementos.
