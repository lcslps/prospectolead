# Seis referências, seis maneiras de organizar atenção

Este guia conecta os documentos de Apple, BMW, Flying Papers, LUNCH, Slush e Air fornecidos pelo usuário. Os estudos são material de consulta, não instruções globais das marcas. Use-os para ampliar decisões em um projeto; não para produzir o mesmo site com seis skins.

## Mapa das contribuições

| Referência | O que conduz o olhar | Papel da tipografia | Papel da mídia | Operação |
|---|---|---|---|---|
| [Apple](study-apple.md) | Espaço, produto e afirmação curta | Display forte com corpo calmo | Explica objeto, detalhe e variante | Ação identificável, pouco ruído |
| [BMW](study-bmw.md) | Fotografia e polaridade branco/carvão | Display leve em grande escala | É o centro expressivo | Moldura textual discreta |
| [Flying Papers](study-flying-papers.md) | Relação entre frase e personagem | Letras como forma de cartaz | Ilustração plana reforça a ideia | Camada estável para ação e leitura |
| [LUNCH](study-lunch.md) | Abertura intensa seguida de catálogo | Uma assinatura forte, metadados contidos | Editorial no hero; comparável no catálogo | Clareza na escolha comercial |
| [Slush](study-slush.md) | Motivo recorrente e colagem | Display como objeto gráfico | Volume renderizado e adesivos | Contornos e posições previsíveis |
| [Air](study-air.md) | Atmosfera escura com ilhas claras | Sans neutra com ruptura localizada | Cenário emocional e prova do produto | Tarefas em superfícies legíveis |

## Aprendizados transversais

### Intensidade tem localização

Apple dá intensidade ao produto e ao título; BMW à fotografia; Flying Papers à relação entre tipo e personagem; LUNCH à abertura; Slush ao motivo e à colagem; Air à atmosfera e a uma ruptura tipográfica. Em todos os casos, uma decisão organiza as demais.

Antes de adicionar efeitos, determine onde estará a maior intensidade e onde a pessoa terá repouso para ler ou agir. Se hero, navegação, cards e formulário forem igualmente expressivos, falta hierarquia.

### Materialidade orienta execução

Papel chapado, metal fotografado, objeto cromado, fita inflável e vidro translúcido exigem assets diferentes. Não espere que a mesma coleção de sombras e gradientes produza todos. Escolha a tecnologia pela função: imagem estática pode representar volume; 3D interativo só se a tarefa ou direção o justificar.

### Cor tem papéis, não somente uma lista

Na Apple, cor aparece fortemente no produto e pontualmente na ação. Na BMW, a fotografia concentra cromatismo. Flying Papers usa palco e elenco de cores. LUNCH usa lilás como pontuação. Slush distingue cores decorativas de ação. Air separa fundo atmosférico de superfícies operacionais.

Ao importar uma paleta, importe a lógica de distribuição e verifique os pares. Não transforme cor de adesivo em sucesso, cor de produto em botão ou cor de fundo em texto sem decidir seu novo papel.

### Geometria não é qualidade em si

Raio zero da BMW/LUNCH e pílulas de Apple/Slush são estratégias diferentes. Nenhuma é superior isoladamente. O efeito depende do objeto, da mídia e do ritmo. Aplique raios por família de componente; não calcule uma média entre estilos para parecer neutro.

### Silêncio visual também exige affordance

Ausência de borda, cor ou ícone em uma captura não prova que toda a operação funciona sem estados. Complete foco, erro, seleção, loading e feedback sem descaracterizar a direção. O usuário precisa perceber ação e resultado, inclusive sem mouse.

## Como combinar com intenção

Escolha uma referência para estrutura e, quando útil, outra para um recurso específico. Isso é uma estratégia de coerência, não um limite obrigatório de quantidade. Descreva a origem e o papel de cada escolha; se duas fontes disputarem a mesma função, resolva antes de implementar.

| Combinação | O que pode funcionar | Decisão que precisa ser resolvida |
|---|---|---|
| Apple + BMW | Estrutura espaçosa com fotografia expressiva | Display pesado ou leve: escolher por papel, não alternar sem motivo |
| Apple + LUNCH | Apresentação clara de produto e catálogo editorial | Geometria e densidade do catálogo precisam de uma regra única |
| LUNCH + Air | Abertura atmosférica e transição para superfície de leitura | Assinatura cromada e cursiva não precisam aparecer juntas |
| Flying Papers + Slush | Tipo-cartaz com linguagem lúdica | Escolher se o material principal é impressão plana ou volume de colagem |
| BMW + Air | Mídia dramática com UI de baixo ruído | Foto do objeto e cenário surreal precisam sustentar o mesmo assunto |
| Apple + Slush | Clareza operacional com um motivo gráfico memorável | Decorar a narrativa sem competir com seleção e compra |

Uma mistura tende a falhar quando reúne apenas marcas de superfície: botão Apple, fonte BMW, mascote Flying Papers, wordmark LUNCH, fita Slush e nuvem Air na mesma hero. O problema é competição de funções, não a quantidade de referências consultadas.

## Método de transferência

1. **Observação:** identifique algo realmente descrito no arquivo.
2. **Princípio:** explique por que essa escolha organiza a experiência.
3. **Decisão do projeto:** adapte ao público, conteúdo, marca e stack atuais.
4. **Implementação:** converta para regras, assets e estados disponíveis.
5. **Prova:** defina como detectar quando a escolha falha.

Exemplo: “LUNCH muda de hero dramático para catálogo calmo” → “a intensidade pode ser distribuída por etapa” → “a coleção abre com imagem autoral, mas filtros e preços ficam em superfície estável” → “duas áreas com tokens semânticos e navegação coerente” → “a pessoa encontra uma variante e entende preço sem voltar à abertura”.

## Três aplicações originais

### Instrumento de áudio

Adote a relação objeto/benefício da Apple com fotografia material da BMW. Mantenha controles demonstrativos e especificações em hierarquia calma. Não copie acabamento de carro ou texto de computador. A prova é reconhecer diferença entre modelos e encontrar uma demonstração real.

### Festival de ilustração

Use o cartaz da Flying Papers para estruturar frases e personagens próprios. Se incorporar Slush, escolha um motivo de colagem específico, sem tornar todos os controles decorativos. Agenda, horários e ingresso continuam estáveis. A versão estática precisa carregar a mesma informação.

### Plataforma de criação visual

Use a separação entre atmosfera e prova da Air, seguida do ritmo calmo de catálogo da LUNCH para mostrar trabalhos. Crie assets adequados à plataforma e mantenha screenshots reais. A prova é explicar o que o produto faz, não apenas parecer cinematográfico.

## Consulta e limites

Busque uma referência pelo nome:

```bash
python scripts/search_design.py apple --domain studies
python scripts/search_design.py 'colagem pastel' --domain studies
python scripts/search_design.py --domain studies --id air --json
```

Para medidas específicas, leia o estudo e, se necessário, o original vinculado. Os valores contraditórios ou inválidos permanecem documentados em [Normalização das referências](reference-normalization.md). Não trate a opinião “nenhum outro site faz isso” de uma referência como fato comprovado.
