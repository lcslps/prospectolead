# Biblioteca consultável Code Makers

Base original de curadoria incluída na skill: **32 direções visuais, 24 paletas, 24 combinações tipográficas e 24 padrões de interação**. São pontos de partida com aplicação, limites e decisões de implementação. Não são um ranking de qualidade nem uma reprodução dos bancos da UI UX Pro Max.

A biblioteca também contém **seis estudos** de Apple, BMW, Flying Papers, LUNCH, Slush e Air elaborados a partir dos MDs fornecidos pelo usuário, totalizando **110 registros pesquisáveis**. Cada ficha remete ao estudo, ao original preservado e às ressalvas técnicas pertinentes.

## Consultar

Execute com Python 3 a partir da pasta da skill; de outro diretório, use o caminho absoluto do script. Tudo funciona offline, sem pacotes externos:

```bash
python scripts/search_design.py 'editorial cultura' --domain styles --limit 3
python scripts/search_design.py 'escuro dados' --domain palettes --limit 3
python scripts/search_design.py 'formulario' --domain patterns --limit 4
python scripts/search_design.py 'leitura' --domain typography --json
python scripts/search_design.py --domain palettes --id oceano-claro --json
python scripts/search_design.py 'apple' --domain studies
python scripts/search_design.py --domain studies --id flying-papers --json
python scripts/search_design.py --list-domains
```

`--domain` aceita `styles`, `palettes`, `typography`, `patterns`, `studies` e `all`. `--limit` aceita 1–20, com padrão 5. `--id` recupera registro exato. Ausência de correspondência produz lista vazia; refine as palavras em vez de considerar itens aleatórios como recomendação.

Busca normaliza caixa e acentos, aplica alguns aliases português/inglês e combina correspondências em nome, tags e conteúdo. Favorece cobertura dos termos e depois pesos de campo. `match_score` é relevância textual; não mede beleza, adequação comercial, acessibilidade ou qualidade de código. Uma busca ampla pode retornar conteúdo por um termo presente em um alerta; leia a ficha.

## Fluxo de escolha

1. Identifique tarefa, público, conteúdo e restrições.
2. Consulte somente o domínio que pode ajudar a decisão aberta.
3. Leia a aplicação e os limites de duas ou três opções relevantes.
4. Adapte a opção à marca existente; não substitua decisões explícitas por resultados de busca.
5. Registre uma escolha concreta no contrato visual e verifique no contexto implementado.

Não carregue todos os arquivos inteiros em toda tarefa. Sem Python, leia o arquivo relevante ou procure o termo diretamente. A biblioteca amplia repertório; a skill continua funcionando com suas referências textuais.

## Estrutura dos dados

- [styles.json](../data/styles.json): direção, tags, composição, aplicação, armadilhas e implementação.
- [palettes.json](../data/palettes.json): cinco papéis de cor e três pares de contraste calculados.
- [typography.json](../data/typography.json): famílias candidatas para display/corpo, contexto e tratamento.
- [patterns.json](../data/patterns.json): tarefa, comportamento e condição de falha a prevenir.
- [studies.json](../data/studies.json): seis fichas de referência com tese visual, aplicação, limites e caminhos para aprofundamento.

Cada arquivo contém `schema_version`, `author`, `kind` e `records`. IDs são estáveis dentro do domínio. Preserve IDs usados por exemplos ao evoluir a base. Famílias de fontes são referências; arquivos de fonte e licenças não estão incluídos.

O arquivo auxiliar [reference-sources.json](../data/reference-sources.json) é um manifesto de procedência e medições; não pertence aos domínios de busca. Os originais são consulta documental, não templates prontos para execução. Leia [Normalização das referências](reference-normalization.md) ao usar seus valores. Exportação de paleta continua restrita ao domínio `palettes`: não exporta automaticamente os pares problemáticos dos estudos.

## Exportar uma paleta

```bash
python scripts/export_palette.py oceano-claro
python scripts/export_palette.py ambar-noturno --output caminho-existente/tokens.css
```

Sem `--output`, imprime CSS. Com saída, cria o arquivo nomeado e exige que o diretório pai exista. Não substitui arquivos existentes, salvo `--force` explicitamente passado. Não use `--force` sobre tokens do usuário sem intenção de substituir aquele arquivo; integre os papéis à nomenclatura já existente.

O exportador verifica novamente texto/fundo, texto/superfície e texto-da-ação/ação. Não gera hover, active, borda, foco, texto secundário, gráficos nem tema alternativo. Complete e verifique esses papéis conforme a interface. Não afirme aprovação de uma página porque a paleta exportou.

## Manutenção

Após alterar scripts ou dados:

```bash
python -B scripts/test_contrast_check.py
python -B scripts/test_design_library.py
```

Testes conferem fórmula, pares, busca, dados, JSON e proteção contra sobrescrita. Eles não testam projetos gerados ou preferências visuais humanas. Adicione registros quando trouxerem uma decisão diferente, não apenas outro nome para o mesmo estilo.
