# Prospector de Leads

Sistema completo de **prospecção de leads locais** usando a **Google Places API (New)**.

Escolha um nicho, cidade e estado, e o sistema busca estabelecimentos reais do Google Maps,
salva no banco (sem duplicados), calcula um lead score, gera mensagens personalizadas e
abre o WhatsApp para você enviar manualmente. Nada de scraping.

## Stack

| Camada    | Tecnologia                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 19 + Vite + TypeScript + TailwindCSS    |
| Backend   | Node.js + Express + TypeScript                |
| Banco     | PostgreSQL 16 (Docker) + Prisma ORM           |
| API       | Google Places API (New) - somente no backend  |
| Validação | Zod                                           |
| Segurança | Helmet, CORS, rate limit, .env ignorado       |

## Estrutura

```
prospectolead/
├─ frontend/            # React + Vite + TS + Tailwind
├─ backend/             # Express + TS + Prisma
│  └─ prisma/           # schema, migrations, seed
├─ docker-compose.yml   # PostgreSQL
└─ README.md
```

## Como rodar (passo a passo)

### 1. Pré-requisitos

- **Node.js** 20 ou superior (recomendado 22+): https://nodejs.org
- **Docker** e Docker Compose: https://www.docker.com/products/docker-desktop
- Uma **chave da Google Places API (New)** com a "Places API (New)" habilitada:
  https://console.cloud.google.com → APIs e serviços → Biblioteca → "Places API (New)" → Ativar → Credenciais → Criar chave de API

### 2. Subir o banco PostgreSQL

```bash
docker compose up -d
```

O banco sobe na porta **5434** (`prospector` / `prospector`, database `prospector`).
> A porta foi alterada de 5432 para 5434 para evitar conflito com outros PostgreSQL locais.
> Para voltar a usar 5432, edite `docker-compose.yml` e a `DATABASE_URL`.

Para verificar: `docker ps` deve mostrar o container `lead_prospector_db` como `healthy`.

### 3. Configurar o backend

```bash
cd backend
npm install
npm install --global prisma        # opcional, para o CLI usar globalmente
```

Copie o exemplo de ambiente e preencha sua chave:

```bash
copy .env.example .env
```

Edite o `backend/.env`:

```
PORT=4000
DATABASE_URL="postgresql://prospector:prospector@localhost:5434/prospector"
GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
FRONTEND_URL="http://localhost:5173"
```

> A chave **nunca** é enviada ao frontend. Ela só existe no arquivo `.env` do backend
> (que está no `.gitignore`).

### 4. Criar o banco (migrations + seed)

```bash
npm run prisma:migrate
npm run prisma:seed
```

`prisma:migrate` cria as tabelas (Lead, Campaign, MessageTemplate, Setting...).
`prisma:seed` cria 2 templates de mensagem prontos.

### 5. Iniciar o backend

```bash
npm run dev
```

A API sobe em `http://localhost:4000` (health check: `GET /api/health`).

### 6. Configurar e iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Abra **http://localhost:5173**.

## Uso

1. **Prospecção** → informe nicho (`dentistas`), cidade (`Sinop`), UF (`MT`) e quantidade (`100`).
   O backend consulta a Google Places API (New), pagina até a quantidade (máx. 500), salva no banco,
   evita duplicados (`googlePlaceId` único) e preenche campos faltantes em leads existentes.
2. **Leads** → tabela com filtros, busca, ordenação, paginação no backend, seleção em massa,
   exportação CSV, enriquecimento (busca de dados extras via API) e ações por lead.
3. **Campanhas** → histórico das prospecções e leads vinculados.
4. **Templates** → mensagens com variáveis `{empresa}`, `{cidade}`, `{estado}`, `{nicho}`,
   `{telefone}`, `{site}`, `{servico}`.
5. **Configurações** → pesos do lead score (0-100).

## Funcionalidades principais

- **Google Places API (New)** com `places:searchText` e `nextPageToken` (paginação).
- **FieldMask sempre** — a busca pede apenas os campos necessários (`places.id,places.displayName,places.formattedAddress,places.addressComponents,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.location`).
- **Lead score configurável** (`LeadScoreService`): sem site (+30), com telefone (+20),
  +15 avaliações (+15), nota ≥ 4.5 (+15), +50 avaliações (+10), endereço completo (+10).
- **Sem duplicados** — `googlePlaceId` único; leads existentes são atualizados apenas com dados faltantes.
- **Economia de API** — nunca consulta detalhes se já tiver os dados; enriquecimento só pede campos faltantes
  (FieldMask dinâmico); a tela de leads não faz chamadas à Google.
- **WhatsApp manual** — `https://wa.me/5566999999999?text=...` com telefone brasileiro normalizado
  (sem automação de envio em massa).
- **Exportação CSV** (Excel-friendly, separador `;`).
- **Dashboard** com cards, leads por status/cidade/nicho e últimos leads.

## Endpoints (resumo)

| Método | Rota                                  | Descrição                                    |
|--------|---------------------------------------|----------------------------------------------|
| GET    | `/api/health`                         | Health check                                 |
| GET    | `/api/dashboard`                      | Métricas do dashboard                        |
| POST   | `/api/prospeccao`                     | Executa prospecção (nicho, cidade, estado, qtd) |
| GET    | `/api/leads`                          | Lista com filtros, ordenação e paginação     |
| GET    | `/api/leads/export/csv`               | Exporta CSV (filtros ou `ids`)               |
| GET    | `/api/leads/:id`                      | Detalhe do lead                              |
| PATCH  | `/api/leads/:id`                      | Atualiza status/observações                  |
| DELETE | `/api/leads/:id`                      | Exclui lead                                  |
| POST   | `/api/leads/:id/enrich`               | Enriquecimento individual                    |
| POST   | `/api/leads/enrich-selected`          | Enriquecimento em massa                      |
| POST   | `/api/leads/bulk/status`              | Altera status em massa                       |
| POST   | `/api/leads/bulk/delete`              | Exclui em massa                              |
| GET    | `/api/campaigns`                      | Lista campanhas                              |
| GET    | `/api/campaigns/:id`                  | Campanha + leads                             |
| DELETE | `/api/campaigns/:id`                  | Exclui campanha                              |
| GET/POST/PATCH/DELETE | `/api/templates`         | CRUD de templates                            |
| POST   | `/api/messages/generate`              | Gera mensagem (`{templateId, leadId}`)       |
| GET/PUT| `/api/settings`                       | Pesos do lead score                          |

Formato de resposta (padrão):

```json
{ "success": true, "data": { } }
```

Erros:

```json
{ "success": false, "message": "mensagem" }
```

## Scripts úteis

Backend (`backend/`):

```bash
npm run dev               # roda com tsx watch
npm run build             # compila TS para dist/
npm start                 # roda o build
npm run typecheck         # checagem de tipos
npm run prisma:migrate    # aplica migrations (dev)
npm run prisma:generate   # gera o Prisma Client
npm run prisma:studio     # abre o Prisma Studio
npm run prisma:seed       # popula templates iniciais
```

Frontend (`frontend/`):

```bash
npm run dev               # dev server na porta 5173
npm run build             # build de produção
npm run typecheck         # checagem de tipos
```

## Configuração dos exemplos

- `frontend/.env` → `VITE_API_URL=http://localhost:4000/api`
- `backend/.env` → `PORT`, `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `FRONTEND_URL`, `NODE_ENV`

**Nunca** coloque `GOOGLE_MAPS_API_KEY` em variáveis `VITE_*` — isso exporia a chave no bundle do frontend.

## Segurança

- API key somente no backend; nunca retornada em respostas.
- Helmet para headers seguros.
- CORS limitado a origens configuradas.
- Rate limit global (1000 req / 15 min por IP).
- Validação Zod em todas as entradas.
- `.env` em `.gitignore` (backend e frontend).

## Limitações conhecidas

- A Google Places API (New) retorna até 20 resultados por página; a prospecção pagina até a quantidade
  solicitada (máx. 500) ou até a API esgotar os resultados. Se pedir 100 e vierem 63, o sistema reporta 63.
- A prospecção é síncrona: o resumo (encontrados/novos/existentes) aparece ao concluir.
- Sem automação de envio em massa de WhatsApp por design (envio manual com a mensagem pré-preenchida).