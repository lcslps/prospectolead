# Pacote de skills — Gerador de Sites

Este pacote deve ser colocado na pasta `skills/` do seu sistema (substituindo/mesclando com
a atual). Estrutura:

```
skills/
├── 00-PROMPT-MESTRE-INTEGRACAO.md   ← leia este primeiro (explica como tudo se conecta)
├── accessibility.md                  ← regras originais que já existiam
├── animations.md
├── conversion.md
├── copywriting.md
├── data-integrity.md
├── food-hospitality.md
├── foundations.md
├── frontend-design.md
├── health-beauty.md
├── home-industrial.md
├── images.md
├── local-business.md
├── local-seo.md
├── responsive.md
├── retail-services.md
├── typography.md
└── codex/
    └── codemakers-design/            ← pacote novo de método de design/UX
        ├── SKILL.md
        ├── agents/
        ├── data/                     ← biblioteca pesquisável (32 direções, 24 paletas,
        │                               24 tipografias, 24 padrões, 6 estudos de marca)
        ├── references/                ← 30 documentos de método (layout, componentes,
        │                               acessibilidade, motion, playbooks, etc.)
        └── scripts/                   ← search_design.py, contrast_check.py, export_palette.py
```

## O que é cada parte

- Os 16 arquivos soltos (`accessibility.md` ... `typography.md`) são as regras que já
  guiavam seu gerador: **integridade factual do negócio, SEO local, conversão e regras por
  segmento**. Continuam valendo exatamente como antes — nada foi alterado neles.
- `codex/codemakers-design/` é o pacote novo: um método completo de direção de arte, sistema
  de design, componentes, layout, motion, acessibilidade e implementação, mais uma biblioteca
  pesquisável offline (via scripts Python, sem dependências externas).
- `00-PROMPT-MESTRE-INTEGRACAO.md` é o documento que **conecta os dois**: define que os fatos
  do negócio e as regras dos 16 arquivos sempre têm prioridade, e que o pacote `codemakers-design`
  é consultado sob demanda para melhorar a qualidade visual/UX do site — nunca para inventar
  informação sobre o negócio.

Nada nos arquivos originais foi modificado — este pacote só organiza e adiciona.
