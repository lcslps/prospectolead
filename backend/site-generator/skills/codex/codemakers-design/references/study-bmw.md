# Estudo BMW.com: a interface como moldura

Base: [MD original fornecido](source-material/bmw.txt). O estudo se refere ao recorte descrito no arquivo, não a uma regra universal de todos os produtos digitais BMW. Conflitos entre narrativa e snippets estão em [Normalização das referências](reference-normalization.md).

## A contribuição central

A referência mostra como uma interface discreta pode sustentar imagens de alta intensidade. O branco da estrutura e o carvão do encerramento funcionam como moldura; a fotografia traz cor, profundidade e materialidade. Tipografia leve em escala grande evita competir com o volume do objeto fotografado.

Isso oferece um contraponto importante ao display pesado de outras referências. Impacto pode vir da combinação entre peso tipográfico leve e fotografia forte. Não é necessário transformar “premium” em título pesado, cor dourada ou sombra abundante.

## Gramática observada

| Dimensão | Evidência do arquivo | Uso na adaptação |
|---|---|---|
| Cor estrutural | `#262626` e branco | Duas polaridades para hierarquia de grandes áreas |
| Superfície auxiliar | `#F1F1F1` | Separação sutil quando o branco contínuo for ambíguo |
| Display | Cerca de 60px, peso 300, entrelinha 1.3 | Título grande de presença leve, com leitura verificada |
| Corpo | 16–18px, entrelinha próxima de 1.6 | Informação calma e legível |
| Geometria narrativa | Raio zero e ausência de sombra | Recorte fotográfico preciso e aparência de galeria |
| Mídia | Full-bleed, close-up, luz dramática | Fazer forma e material carregarem expressão |
| Ação | Link textual com direção | Reduzir ornamentação sem apagar affordance |

O token cinza `#BBBBBB` não é uma cor universal de texto secundário: sobre branco o contraste é aproximadamente 1.920:1; sobre carvão é 7.883:1. O contexto muda completamente sua função.

## Composição por polaridade

Use a passagem entre áreas claras e escuras como mudança de capítulo. Uma foto escura full-bleed pode abrir a página; um bloco branco separado oferece título e ação com leitura estável. O rodapé escuro organiza encerramento e navegação complementar.

Não transforme isso em proibição de toda sobreposição em qualquer projeto. No recorte estudado, retirar UI da fotografia protege o objeto e simplifica contraste. Se o cliente precisar de ação sobre a mídia, trate como adaptação consciente e verifique crop, texto e foco.

## Fotografia: o que precisa existir

O resultado depende de imagens capazes de funcionar como composição. Procure direção de luz, bordas reconhecíveis, relação entre brilho e sombra e detalhe que revele construção. Foto genérica escura com um filtro azul não reproduz a mesma lógica.

Crie uma sequência com função: plano que apresenta, detalhe que revela e enquadramento que compara quando necessário. Não recorte a única informação que permite reconhecer o produto. O tratamento deve preservar material e cor do objeto real.

## Componentes

**Cabeçalho:** estrutura simples e alinhamento preciso. Um header baixo no exemplo não autoriza alvos minúsculos nem clipping ao ampliar texto. O logo real e a tagline do cliente devem continuar reconhecíveis.

**Título leve:** usar peso 300 exige fonte que se mantenha legível no tamanho real. Em uma alternativa com traços mais delicados, aumentar peso pode ser a adaptação correta. Não preserve um número às custas da leitura.

**Link com seta:** texto suficiente para nomear destino, foco visível e estado identificável. Evite alterar peso de modo que a largura da navegação salte a cada hover.

**Rodapé em colunas:** agrupe links por significado, não para atingir quatro colunas. No mobile, empilhe ou use disclosure quando apropriado. Idioma atual deve ser identificável, mesmo que o documento diga que isso era implícito.

**Estados de operação:** formulário, erro ou seleção que não aparecem no recorte precisam de tratamento funcional. É possível manter linguagem monocromática com texto e forma; não elimine estados só porque a referência não os mostra.

## Receita de contraste entre galeria e informação

```css
.object-gallery { color: #262626; background: #ffffff; }
.object-gallery__media { margin: 0; }
.object-gallery__media img { display: block; inline-size: 100%; block-size: auto; }
.object-gallery__statement {
  inline-size: min(100% - 2rem, 75rem);
  margin-inline: auto;
  padding-block: clamp(2.5rem, 5vw, 4.5rem);
  text-align: center;
}
.object-gallery__title {
  font-size: clamp(2.25rem, 1.5rem + 3vw, 3.75rem);
  font-weight: 300;
  line-height: 1.3;
}
.object-gallery__footer { color: #ffffff; background: #262626; }
```

O trecho depende da fonte e do conteúdo reais. Imagens com proporções inadequadas podem precisar de direção de crop; `width: 100%` não resolve a composição por si só. A ação continua precisando de semântica e foco.

## Mobile e ritmo

Evite reduzir fotografia a uma faixa irreconhecível. Uma imagem vertical alternativa ou corte específico pode preservar a sensação escultórica. Reduza espaço entre título e ação sem colá-los à imagem. Corpo em linha curta pode usar entrelinha confortável sem parecer um bloco disperso.

O arquivo descreve geometria angular e depois traz raios diferentes em um bloco `@theme`. A adaptação adota a narrativa dominante para esta direção e registra o conflito, em vez de aplicar todos os tokens contraditórios.

## Transferência e teste

Aplicável a objetos, arquitetura, joalheria ou trabalhos fotográficos quando há assets fortes. Pode falhar em um produto que precisa de comparação densa ou muita instrução antes da ação.

Teste reconhecimento do objeto, leitura do display leve, navegação por teclado, colunas do rodapé, idioma atual e acesso à ação no mobile. A ausência de cromatismo deve reduzir ruído, sem reduzir informação funcional.
