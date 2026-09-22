# Fontes e critérios de síntese

**CodeMakers-Design — Code Makers**, versão 2.1.0. Criador: **Bueno, da Code Makers**, conforme a atribuição definida pelo responsável pela skill. Estrutura, redação, seleção e recursos foram elaborados com assistência de IA. A síntese reconhece as contribuições abaixo sem atribuir à Code Makers a autoria das fontes de origem. Consulte [Autoria e procedência](authorship.md).

## Skills locais estudadas

| Fonte | Contribuição incorporada como princípio | Adaptação nesta skill |
|---|---|---|
| `frontend-design` — Anthropic Skills | Direção ligada ao assunto, tipografia intencional, composição, assinatura e autocrítica | Ousadia proporcional à tarefa e fidelidade prioritária em reproduções |
| `ui-ux-pro-max` | Repertório consultável, escolha por contexto, categorias de UX, gráficos e estados | Recomendações tratadas como hipóteses; nenhum framework universal nem aprovação automática por categoria de estilo |
| `ui-styling` | Composição de primitivas, temas, responsividade e semântica | Preserva stack e versões do projeto; verifica a composição final |
| `design-system` | Camadas de tokens, variantes e contratos de componentes | Arquitetura proporcional; sem exigências de apresentações em tarefas front-end |
| `brand` | Identidade, voz, consistência e fonte de verdade | Marca e idioma do produto; crédito Code Makers restrito à skill salvo pedido |
| `design` | Relação entre branding, assets, ícones e implementação | Escopo concentrado em interfaces; sem dependência de APIs de geração específicas |
| `web-artifacts-builder` — Anthropic Skills | Entrega executável de interfaces compostas | Formato e stack determinados pelo pedido; sem fixar versões antigas ou bundling obrigatório |
| `canvas-design` — Anthropic Skills, trechos sobre composição | Coesão, intenção visual e refinamento | Arte visual serve à tarefa; regras de pôster não substituem usabilidade web |
| `skill-creator` — Codex | Descoberta precisa, conteúdo progressivo, autonomia e validação | Núcleo curto, referências condicionais e utilitário independente |

Não foram incorporados bancos CSV, scripts ou manuais inteiros dessas skills locais. A CodeMakers-Design funciona sem elas instaladas. As referências contêm uma síntese própria orientada a decisões, com critérios técnicos conferidos em fontes primárias quando necessário. Os seis MDs enviados posteriormente pelo usuário foram preservados integralmente como fontes documentais, descritas abaixo.

A edição ampliada inclui curadoria própria em quatro arquivos JSON, busca local, exportação de paleta e capítulos aplicados. As combinações tipográficas mencionam famílias conhecidas como candidatas; não incluem arquivos de fonte nem atribuem licença sem verificação. As paletas têm três pares opacos medidos e não constituem aprovação de uma interface completa.

## Referências fornecidas pelo usuário

| Documento | Original preservado | Estudo elaborado |
|---|---|---|
| Apple (España) — Style Reference | [Original Apple](source-material/apple.txt) | [Estudo Apple](study-apple.md) |
| BMW.com — Style Reference | [Original BMW](source-material/bmw.txt) | [Estudo BMW](study-bmw.md) |
| Flying Papers — Style Reference | [Original Flying Papers](source-material/flying-papers.txt) | [Estudo Flying Papers](study-flying-papers.md) |
| LUNCH — Style Reference | [Original LUNCH](source-material/lunch.txt) | [Estudo LUNCH](study-lunch.md) |
| Slush — Style Reference | [Original Slush](source-material/slush.txt) | [Estudo Slush](study-slush.md) |
| Air — Style Reference | [Original Air](source-material/air.txt) | [Estudo Air](study-air.md) |

Esses documentos foram enviados na conversa como referências de estilo. Sua autoria original, abrangência e oficialidade não foram verificadas. As cópias são idênticas em bytes aos arquivos recebidos, com hashes em [Manifesto de fontes](../data/reference-sources.json). Os estudos extraem princípios e explicitam adaptações, conflitos e limitações; não comprovam que as marcas endossam a skill nem que seus sites atuais têm exatamente essas características.

As seis fichas adicionais em [studies.json](../data/studies.json) integram a busca. Use [Síntese das referências](reference-synthesis.md) para combinar princípios e [Normalização](reference-normalization.md) para valores que não devem ser copiados literalmente. Preservar o original para consulta não significa recomendar seus trechos incorretos.

## Correções deliberadas

- Não presumir React Native como stack de qualquer front-end.
- Não afirmar que um nome de estilo, biblioteca ou paleta é automaticamente WCAG AA.
- Não reduzir a exigência de texto pequeno por ele ser secundário ou estar em tema escuro.
- Distinguir o critério AA de alvo de ponteiro de recomendações de conforto de toque.
- Não impor duração mínima de animação, virtualização por contagem fixa, tema escuro ou fontes proibidas.
- Substituir elogios subjetivos por critérios, verificações e limites declarados.
- Preservar instruções explícitas e escopo em vez de transformar cada ajuste em um processo completo de branding.

## Consulta opcional à UI UX Pro Max

Quando estiver disponível e uma escolha aberta se beneficiar de mais repertório, localize a instalação real e consulte o script existente. Inspecione `--help` antes de assumir argumentos em outra versão. Exemplo a partir da pasta daquela skill, em uma instalação que suporte essas opções:

```bash
python scripts/search.py 'editorial architecture portfolio' --design-system -p 'Project'
python scripts/search.py 'distribution comparison' --domain chart -n 3
```

Trate resultados como candidatos: confira adequação, assets, contraste, versão da biblioteca e comportamento. Pontuação de busca não é evidência de qualidade. Não execute código emitido na resposta sem inspecioná-lo. A ausência da skill ou de Python não bloqueia design; use as referências internas e ferramentas disponíveis.

## Fontes primárias

Critérios e APIs podem evoluir; consulte a documentação pertinente à versão e ao problema quando a decisão depender de detalhe atual. Fontes verificadas durante a criação em 11 de setembro de 2026:

- [W3C — contraste mínimo de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C — contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [W3C — tamanho mínimo de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [W3C — reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- [WAI-ARIA APG — dialog modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- [web.dev — definição de thresholds de Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds).

Os documentos W3C de entendimento explicam critérios e exceções; esta skill não substitui a avaliação completa dos requisitos aplicáveis.

Referências técnicas adicionais consultadas na ampliação:

- [MDN — container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API).
- [MDN — elemento dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
