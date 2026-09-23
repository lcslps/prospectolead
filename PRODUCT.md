# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Agências e freelancers que prospectam negócios locais brasileiros. Situação: prospecção outbound — precisam achar bons leads, mostrar valor rápido com um mockup de site premium e converter em venda de projeto.

## Product Purpose

Encontrar leads locais, gerar landing pages one-page de alto padrão com IA e gerenciar tudo num CRM simples. Sucesso = sair de um lead frio para um site apresentável e salvo no lead em minutos.

## Positioning

Prospecção + geração + CRM num fluxo só (buscar no Google Places → importar → gerar com Gemini/Flux → preview → salvar/duplicar no lead). Vizinhos fazem só lista de leads ou só gerador de site; aqui o mockup é a peça de venda.

## Operating Context

Fluxos: buscar por nicho/cidade/UF (`/leads`), importar para o CRM (`/crm`), abrir lead (`/crm/:id`), gerar a partir do lead ou avulso (`/criar`), acompanhar log de modelos/imagens, preview com skeletons, salvar HTML no lead, listar/duplicar/excluir projetos (`/projetos`). Frontend React + Vite + Tailwind, backend Express em `http://localhost:3001`. Todo conteúdo gerado em pt-BR.

## Capabilities and Constraints

- Busca: Google Places API (New) via `POST /api/leads/search`, catálogo em `backend/lib/niches.js`, geo em `backend/lib/geo.js`.
- Texto: Gemini via `POST /api/generate-text` com fallback `gemini-3.1-pro-preview`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`; `systemInstruction = STYLE_GUIDE` em `frontend/src/lib/prompts.ts`.
- Imagem: Cloudflare Workers AI FLUX via `POST /api/image`; sem texto na foto.
- Contrato de máquina do site gerado: 5 `section` (`hero`, `diferenciais`, `destaques`, `depoimentos`, `contato`), exatamente 4 imagens (`hero`, `card_1`, `card_2`, `card_3`) via `[[IMG:id]]`, `img.hero-media` com `object-fit: cover`, overlay ≤ 0.58, CTA `tel:`/`wa.me`, Lucide, 100% sans-serif, full-width, ≤ 18.000 caracteres, sem comentários.
- Stack em aberto: usuário autorizou sugerir troca de modelos, idiomas ou estrutura de saída.

## Brand Commitments

Nome exibido "Gerador de Sites", voz pt-BR direta de ferramenta de trabalho, Marca "AI" em bloco azul no sidebar. Nenhum asset de identidade vinculante além do código atual.

## Evidence on Hand

- `backend/lib/places.js`, `backend/lib/store.js`, `backend/index.js` (rotas leads/CRM/generate/image/sites).
- `frontend/src/lib/prompts.ts` (STYLE_GUIDE + OUTPUT_FORMAT + validação/reparo), `frontend/src/lib/gemini.ts`, `frontend/src/lib/cloudflare.ts`, `frontend/src/lib/leads.ts`.
- Telas: `frontend/src/pages/private/Leads.tsx`, `Crm.tsx`, `LeadDetail.tsx`, `Criar.tsx`, `Projetos.tsx`, `ProjetoPreview.tsx`; shell em `frontend/src/App.tsx`.
- Ausências que não devem ser fabricadas: depoimentos/clientes reais, pricing, benchmarks de conversão.

## Product Principles

- Velocidade de prospecção: menos campos, busca tolerante, importar em um clique.
- Prova visual vende: o site gerado é o argumento comercial, não um anexo.
- Especificidade por nicho: copy, paleta e fotos plausíveis do ramo, nunca genérico.
- Contrato confiável: HTML completo e verificável antes de salvar no lead.
- Economia de tokens: CSS curto reutilizável, libs injetadas pelo reparo, sem boilerplate no modelo.
