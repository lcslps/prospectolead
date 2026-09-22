# Estudo Air: atmosfera no fundo, precisão na tarefa

Base: [MD original fornecido](source-material/air.txt). As descrições de céu, vidro, variantes tipográficas e componentes são interpretações desse material, não uma auditoria da implementação atual da Air.

## A contribuição central

A referência combina uma camada emocional — céu escuro e forma translúcida — com uma interface de trabalho mais clara e contida. A atmosfera situa a marca; cards claros e screenshots oferecem evidência do produto. A tensão tipográfica aparece em um detalhe cursivo e, pontualmente, em display comprimido.

O aprendizado é separar cenário de operação. Usar vidro em uma imagem não exige tornar todos os campos translúcidos. Um fundo escuro não exige texto fraco. Um título expressivo não exige três fontes competindo em cada seção.

## Gramática observada

| Dimensão | No arquivo | O que transferir |
|---|---|---|
| Palco | Preto e fotografia atmosférica escura | Dar profundidade à narrativa com mídia própria |
| Ilhas de conteúdo | Haze `#F5F5F5` com tinta `#1B1B1B` | Oferecer leitura e operação em superfícies previsíveis |
| Voz de interface | Sans neutra, frequentemente peso 500 | Consistência de UI para conter a expressividade do cenário |
| Ruptura tipográfica | Uma palavra cursiva ou display comprimido | Marcar uma ideia com contraste localizado |
| Forma | Inputs pequenos raios; cards e botões moderados | Diferenciar controles por função sem arredondamento universal |
| Ações | Ghost em fundo escuro, superfície clara quando necessário | Ajustar o par ao contexto mantendo hierarquia |
| Prova do produto | Screenshots em cards claros | Conectar a narrativa à funcionalidade visível |

## Construção em duas camadas

Na camada narrativa, escolha uma imagem que sustente a frase e deixe área legível para texto. A forma de vidro precisa conversar com luz, escala e enquadramento; um objeto 3D aleatório não cria uma relação com o produto.

Na camada funcional, use superfície sólida para screenshots, formulários ou tarefas com leitura prolongada. Separe a legenda do cenário para não exigir que a pessoa busque texto sobre nuvens a cada detalhe.

Alterne áreas de atmosfera e prova. Se cada seção for apenas outra frase sobre uma imagem bonita, a oferta continua abstrata. Mostre como a pessoa cria, encontra ou transforma algo no produto real.

## Tipografia com ruptura controlada

Defina três papéis quando necessários: sans de interface, display de impacto e ênfase cursiva. Uma palavra em outra voz pode sinalizar um conceito importante; usar cursiva em toda frase transforma a exceção em ruído.

Uma fonte manuscrita disponível não é necessariamente equivalente à cursiva customizada mencionada no arquivo. Avalie construção, inclinação, largura e ritmo. O fallback pode ser um itálico convencional se preservar melhor o contraste desejado.

O display de 259px e entrelinha 0.85 é contextual. Texto real, acentos e telas pequenas precisam de outra escala ou composição. Não converta frases em imagens para escapar dessas restrições; mantenha conteúdo textual acessível.

## Contraste e transparência

O azul `#426188` sobre preto mede aproximadamente **3.297:1**: pode atender ao corte numérico de texto grande, mas não ao de texto normal. O azul de link `#2B7FFF` sobre Haze `#F5F5F5` mede cerca de **3.450:1**, também insuficiente para texto normal. Fundo fotográfico exige ainda medir a composição efetiva.

O original descreve um toggle com fundo escuro translúcido e texto preto. Sem contexto e cor composta, isso não é um par reutilizável. Defina explicitamente texto em cada estado e superfície, em vez de copiar uma expressão incompleta de cor.

Não aplique `opacity` ao card inteiro para simular delicadeza: isso reduz contraste do texto junto com o fundo. Controle superfície separadamente e verifique o resultado.

## Componentes

**Ghost CTA:** funciona quando o fundo adjacente é estável e a hierarquia é clara. Sobre imagem variável, pode precisar de área sólida ou reposicionamento. Foco deve ser visível além de uma borda já existente.

**Haze card:** superfície clara distingue conteúdo por polaridade. Reserve proporção de screenshots e permita ampliar detalhe quando a demonstração ficar ilegível. Uma screenshot minúscula de dashboard não é evidência utilizável.

**Input:** mantenha label, ajuda e erro. Borda muito sutil pode ser insuficiente quando necessária para reconhecer o campo contra a superfície. A aparência minimalista não deve reduzir descoberta ou feedback.

**Título misto:** use markup textual e relações semânticas corretas; não insira quebras ou palavras artificiais para encaixar o efeito. A ênfase deve corresponder ao significado.

**Logos de clientes:** só use logos reais fornecidos ou autorizados para aquela relação. A existência de uma “logo bar” na referência não autoriza inventar prova social.

## Receita de atmosfera e superfície de trabalho

```css
.atmospheric-story { color: #ffffff; background: #000000; }
.atmospheric-story__inner { inline-size: min(100% - 2rem, 71.875rem); margin-inline: auto; }
.atmospheric-story__title { font-size: clamp(2.5rem, 1.75rem + 3vw, 4.5rem); line-height: 1.08; }
.atmospheric-story__emphasis { font-style: italic; }
.atmospheric-story__proof {
  color: #1b1b1b;
  background: #f5f5f5;
  border-radius: 12px;
  padding: clamp(1.25rem, 3vw, 2rem);
}
.atmospheric-story__proof a { color: #1b1b1b; text-decoration: underline; }
```

Esse trecho mantém um par previsível no card e usa itálico como fallback de contraste tipográfico. Não afirma reproduzir o material de vidro, a fonte customizada ou a fotografia de origem. Imagem, focus states e motion ainda precisam de implementação pertinente.

## Mobile, performance e movimento

Planeje crop e área de leitura para a imagem estreita. Um asset de vidro detalhado pode ser entregue como imagem responsiva se a interação não exigir volume real. Mídia do topo precisa de carregamento e dimensões planejados; não carregue uma cena pesada apenas por o conceito mencionar 3D.

Animação é um acréscimo, não uma inferência automática da fotografia. Se houver movimento atmosférico, mantenha a tarefa acessível em composição estática e pare trabalho quando não for útil.

## Transferência e prova

Útil para produtos criativos que conseguem conectar atmosfera e demonstração. Pode falhar quando a UI oferece emoção, mas não explica o que o produto faz.

Verifique leitura sobre os crops reais, contraste de links dentro dos cards, foco das ações ghost, compreensão das screenshots e versão sem mídia. A camada emocional deve atrair; a camada funcional deve permitir avaliar e agir.
