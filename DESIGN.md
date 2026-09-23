---
name: ProspectoLead Panel
description: Mesa de trabalho limpa para prospectar leads e gerar sites.
colors:
  accent: "#2563eb"
  accent-focus: "#5b8cff"
  ink: "#1a1d21"
  secondary: "#5f6570"
  muted: "#9aa0ab"
  app-bg: "#f4f6f9"
  surface: "#ffffff"
  field-bg: "#f1f3f6"
  field-bg-hover: "#e8ebf0"
  border: "#e4e7ec"
  input-border: "#d4d9e0"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "9px"
  md: "10px"
  lg: "14px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  button-secondary:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: ProspectoLead Panel

## Overview

**Creative North Star: "Mesa de trabalho limpa"**

O painel é ferramenta, não vitrine. Densidade calma, uma coluna de trabalho e preview ao lado, tudo em português direto. A expressão visual mora nos sites gerados (variam por nicho via `STYLE_GUIDE`); aqui o sistema segura o fundo para o conteúdo respirar.

**Key Characteristics:**
- Uma família tipográfica, pesos fazem a hierarquia.
- Superfícies brancas sobre fundo cinza-azulado, borda fina como separador.
- Controles contidos, estados legíveis, sem decoração.

## Colors

Azul único de ação sobre neutros frios; raridade do acento é o ponto.

### Primary
- **Azul de ação** (#2563eb): CTA, item de navegação ativo, logo "AI". Usado em ≤10% da tela.

### Neutral
- **Tinta** (#1a1d21): texto principal e títulos.
- **Secundário** (#5f6570): labels, descrições, kicker de menu.
- **Suave** (#9aa0ab): placeholders e textos de apoio.
- **Fundo do app** (#f4f6f9): base atrás dos cards.
- **Superfície** (#ffffff): cards, sidebar, inputs.
- **Campo** (#f1f3f6): botões secundários em repouso; hover (#e8ebf0).
- **Borda** (#e4e7ec): separadores e contornos de card.
- **Borda de input** (#d4d9e0): contorno de campo; foco (#5b8cff).

### Named Rules
**The One Voice Rule.** Só o azul #2563eb age; neutros nunca competem com ele.

## Typography

**Display Font:** Poppins (com sans-serif)
**Body Font:** Poppins (com sans-serif)

**Character:** Geométrica redonda e calma; hierarquia por peso e tamanho, nunca por segunda família.

### Hierarchy
- **Display** (600, 15px, 1.2): títulos de painel e sidebar; tracking apertado.
- **Body** (400, 13.5px, 1.5): formulários, listas, logs.
- **Label** (500, 12.5px, 1.4): rótulos de campo acima do input.
- **Kicker** (600, 11px, uppercase, 0.12em): apenas "Menu" na sidebar.
- **Nav** (400/600, 14px): itens de navegação; ativo fica 600 em branco sobre azul.

### Named Rules
**The Single Family Rule.** Poppins resolve tudo; nova família só com papel que ela não cumpra.

## Layout

Sidebar fixa à esquerda no desktop (248px, branca, borda direita #e4e7ec, sticky full-height); mobile usa topbar. Conteúdo em coluna fluida com teto de leitura (1360px, px-6, pt-7, pb-20). Tela Criar em grid (400px + preview flexível); colapsa para uma coluna no mobile. Ritmo por proximidade: grupos justos dentro do card (mt-3.5), separação generosa entre cards (mb-3, gap-5).

## Elevation & Depth

Sistema plano por padrão; profundidade responde a estado, não decora.

### Shadow Vocabulary
- **Repouso de card** (`box-shadow: 0 1px 2px rgba(16,24,40,0.06)`): única sombra do sistema, sempre com borda de 1px #e4e7ec junto.

### Named Rules
**The Flat-By-Default Rule.** Sem sombra sem borda; hover aprofunda cor, não empilha sombra.

## Shapes

Cantos moderadamente arredondados e consistentes: card (14px), botões e inputs (10px), selo do logo (9px). Sem pílulas exceto controles pequenos; sem clipping ou máscara decorativa.

## Components

### Buttons
- **Shape:** cantos contidos (10px).
- **Primary:** fundo #2563eb + texto branco + borda transparente; ativo da nav.
- **Hover / Focus:** secundário vai de #f1f3f6 para #e8ebf0; foco de input troca borda para #5b8cff sem outline.
- **Secondary:** fundo #f1f3f6 + texto #1a1d21 + borda #e4e7ec.

### Cards / Containers
- **Corner Style:** suavemente arredondado (14px).
- **Background:** branco #ffffff sobre #f4f6f9.
- **Shadow Strategy:** ver Elevation & Depth.
- **Border:** 1px #e4e7ec sempre.
- **Internal Padding:** escala de painel (20px).

### Inputs / Fields
- **Style:** branco, borda #d4d9e0, cantos (10px), texto 13.5px, placeholder #9aa0ab.
- **Focus:** borda #5b8cff.
- **Error / Disabled:** não padronizados no código atual; usar texto #5f6570 e manter borda.

### Navigation
- Sidebar vertical com rótulo "Menu"; item ativo azul com descrição em branco/80, inativo cinza com descrição #5f6570; ícone Lucide 16px ao lado do rótulo 14px. Mobile colapsa para topbar.

## Do's and Don'ts

### Do:
- **Do** manter uma família (Poppins) com fallback sans-serif em todo o painel.
- **Do** reservar o azul para a ação primária da tela.
- **Do** agrupar por proximidade antes de adicionar caixa ou divisor.

### Don't:
- **Don't** trazer para o painel as receitas visuais dos sites gerados (hero de campanha, palavra gigante, selo girando) — elas pertencem ao `STYLE_GUIDE`, não ao app.
- **Don't** adicionar segunda cor de acento ou sombra nova sem atualizar este arquivo.
- **Don't** usar serifada, emoji como ícone ou card-dentro-de-card no painel.
