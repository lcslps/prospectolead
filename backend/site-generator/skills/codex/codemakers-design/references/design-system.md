# Tokens, componentes e responsividade

## Sistema proporcional ao projeto

Inspecione padrões existentes antes de criar abstrações. Um site pequeno pode usar um único arquivo de variáveis; um produto com múltiplos temas pode precisar de camadas e documentação. Não transforme uma página em uma biblioteca universal.

Use três níveis quando trouxerem valor:

1. Primitivos: valores de cor, espaço, fonte, raio e duração.
2. Semânticos: papéis como texto principal, superfície elevada, ação e erro.
3. Componente: exceções estáveis de um componente, sem repetir todos os aliases.

Exemplo ilustrativo, não uma paleta padrão da Code Makers:

```css
:root {
  --neutral-0: #ffffff;
  --neutral-950: #17212b;
  --ocean-800: #155e75;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --surface: var(--neutral-0);
  --text: var(--neutral-950);
  --action: var(--ocean-800);
  --on-action: var(--neutral-0);
  --control-radius: 0.5rem;
}

.primary-action {
  color: var(--on-action);
  background: var(--action);
  border-radius: var(--control-radius);
  padding: var(--space-3) var(--space-4);
}
```

Esse trecho só ilustra o encadeamento; estados, bordas, foco e comportamento ainda precisam ser implementados. Os valores reais devem vir do projeto. Literais pertencem às definições e a exceções justificadas; não crie uma variável para cada pixel único.

## Contrato de componente

Documente apenas o necessário para implementar e reutilizar:

- Propósito e anatomia: qual tarefa resolve, conteúdo exigido e o que é opcional.
- Semântica: link, botão, campo, disclosure, dialog, tabela etc.
- Variantes: distinguem intenção; tamanhos distinguem densidade ou contexto.
- Estados: entradas, feedback visível, comportamento e anúncio relevante.
- Conteúdo: texto longo, ausência de ícone, quantidade variável, truncamento e recuperação do texto completo.
- Adaptação: largura, quebra, ordem, área de interação e comportamento em containers pequenos.
- Integração: eventos, estado controlado, validação e contratos que não podem regredir.

Prefira variantes explícitas a uma combinação de flags incompatíveis como `isPrimary + isDanger + isGhost`. O estado carregando não deve provocar salto de largura nem perda silenciosa do nome acessível. Elemento desabilitado não deve parecer a única forma de descobrir o motivo da indisponibilidade.

## Temas

Crie tema escuro quando solicitado ou já fizer parte do produto. Não adicione um toggle apenas para demonstrar sofisticação. Quando existir, mapeie papéis semânticos por tema; não inverta cores globalmente.

Verifique cada par de texto e superfície, status, seleção, ícones e foco nos temas suportados. Bordas decorativas e controles funcionais têm necessidades diferentes. Sombras podem perder função em superfícies escuras; avalie borda e diferença tonal.

Na inicialização, respeite preferência explícita, padrão do produto e preferência do sistema segundo a arquitetura existente. Evite flash de tema incorreto e divergência entre HTML do servidor e hidratação. Defina `color-scheme` quando apropriado para controles nativos.

## Layout por restrição de conteúdo

Projete comportamento no menor espaço útil e expanda quando o conteúdo pedir. Breakpoints do projeto são pontos de partida; teste larguras intermediárias. Container queries podem ser melhores para componentes usados em colunas diferentes, se a compatibilidade do projeto permitir.

Defina largura máxima de leitura separada da largura máxima de grid. Use tracks flexíveis, `minmax()` e `min-width: 0` nos filhos que precisam encolher. Proteja tokens, URLs e nomes longos com quebra adequada ao conteúdo; não quebre valores que precisam ser lidos juntos sem avaliar.

Não resolva overflow com `overflow-x: hidden` no documento: identifique elemento, largura mínima, margem ou transformação responsável. Use rolagem contida para estruturas legitimamente bidimensionais, com orientação e acesso por teclado quando necessários.

Mantenha ordem de DOM coerente com leitura e teclado. Reordenação visual extensa com CSS pode produzir uma jornada diferente para quem não vê a tela. Ações principais devem continuar encontráveis após o empilhamento mobile.

Para headers, drawers e CTAs fixos, considere teclado virtual, área segura, altura dinâmica e conteúdo/foco encobertos. Prefira altura mínima e conteúdo fluido a telas rígidas de `100vh`. Teste overlays curtos e longos.

## Evolução e consistência

Registre decisões globais na fonte de verdade existente; exceções locais devem explicar motivo e alcance. Evite documentos de design divergentes do CSS real.

Migre tokens por grupos de componentes verificáveis. Remover um token exige inspecionar usos, inclusive em temas. Não faça uma troca global de cores que transforma alertas, gráficos ou logos indevidamente.

Uma biblioteca reutilizável deve incluir exemplos de uso representativos e estados difíceis. Catálogos visuais como Storybook são úteis quando já existem ou quando o trabalho inclui a biblioteca; não os adicione para uma correção pontual.
