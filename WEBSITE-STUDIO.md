# Prospecção, CRM e sites

## Arquitetura do gerador de sites

Cada site é um `StoredSite` (`schemaVersion` 2) com artefato `html-standalone`: `index.html`, `styles.css` e `script.js` gerados pelo Gemini e renderizados em iframe no editor e na rota pública. O backend não decide design: o Gemini atua como agente de design e escreve o código seguindo um pipeline explícito.

```
Lead no CRM → Gemini analisa o negócio
  → direção criativa + design system + componentes + estratégia de conversão (designPlan)
  → gera HTML/CSS/JS originais → resolve imagens reais
  → validação estrutural → se crítico, correção automática via Gemini (modelo auxiliar)
  → commit como nova versão (edições preservam identidade)
```

- `backend/src/services/SitePrompt.ts` instrui o agente: processo de projeto (planejar antes de codar), catálogo de componentes, regras de design system, conteúdo verificado, veto a templates reciclados e a fatos inventados, responsividade e estrutura de arquivos.
- `backend/src/services/siteArtefactSchema.ts` define `seo`, `designPlan` (análise, direção, design system, componentes/`pageFlow`, conversão, variantes) e `files`; tokens de imagem `{{...}}` nunca são inventados pelo modelo.
- `backend/src/services/GeminiService.ts` valida a resposta do modelo com JSON Schema; `backend/src/services/SiteQuality.ts` (`inspectArtifact`/`criticalIssues`) checa estrutura, `<title>`, viewport, tokens pendentes e imagens quebradas; `WebsiteService.settleFiles` corrige via Gemini (1 tentativa) e falha com `502` se o problema persistir.
- `backend/src/services/SiteImages.ts` + `backend/src/services/LeadSocialService.ts` levantam fotos reais (Google Places, Instagram, Facebook, site do estabelecimento e via Pexels/Pixabay/Unsplash para lacunas licenciadas). Intents de imagem são resolvidos por esses provedores e persistidos como `WebsiteAsset`.
- `WebsiteVersion` registra checkpoints de geração, edição e publicação. Regenerar cria nova direção de arte usando o `designPlan` atual como referência de diferenciação; o editor (`custom`/`rewrite`) recebe o `designPlan` vigente para preservar identidade e conteúdo.

## Como usar

1. Pesquise em **Prospecção** e abra **Resultados da prospecção**.
2. Clique em **Enviar para o CRM** (ou **Adicionar ao CRM** nos detalhes).
3. Abra o card no **CRM** e clique em **Gerar site com IA**. O overlay mostra as etapas: análise do negócio, direção/design system, componentes, código e validação.
4. No studio, a prévia é o site real em iframe; o painel mostra fatos verificados, decisões do agente de design e imagens reais usadas. Use desktop/tablet/móvel e zoom.
5. **Pedir à IA** edita o site preservando identidade, design system e conteúdo; cada ajuste cria nova versão.
6. **Regenerar** gera um novo projeto visualmente diferente, mantendo os fatos reais.
7. **Publicar** salva um snapshot público em `/s/:websiteId`. Alterações posteriores ficam no rascunho até nova publicação.

## Configuração

No `backend/.env`, preencha:

```dotenv
GOOGLE_MAPS_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
GEMINI_AUX_MODEL=gemini-3.8-flash-lite
GEMINI_THINKING_LEVEL=low
MAX_RETRIES=3
MAX_CONCURRENT_GENERATIONS=2
PEXELS_API_KEY=
PIXABAY_API_KEY=
UNSPLASH_ACCESS_KEY=
FACEBOOK_ACCESS_TOKEN=
GEMINI_SEND_IMAGES=true
```

- `GEMINI_MODEL` (padrão `gemini-3.8-flash`) é o modelo principal: cria e revisa os sites. O backend nunca decide cores, layout ou estilo; o Gemini faz a direção de arte.
- `GEMINI_AUX_MODEL` (padrão `gemini-3.8-flash-lite`) é o modelo barato usado em tarefas auxiliares (correção estrutural no `settleFiles`). Se vazio, usa `GEMINI_MODEL`.
- `MAX_RETRIES` (padrão `3`) define tentativas extras após a primeira com backoff exponencial + jitter em `429`/`5xx`/timeout, respeitando o header `Retry-After` quando enviado.
- `MAX_CONCURRENT_GENERATIONS` (padrão `2`) limita sites gerados simultaneamente pela fila, protegendo contra estouro de cota.
- `GEMINI_THINKING_LEVEL` aceita `low`, `medium` ou `high` e controla o nível de raciocínio do modelo.
- `GEMINI_SEND_IMAGES` (`true`/`false`, padrão `true`) controla se as fotos reais são anexadas ao Gemini para ele escolher o encaixe.
- USe um modelo disponível na sua conta com suporte a saída estruturada. Reinicie o backend após alterar o `.env`. Nenhuma variável deve receber prefixo `VITE_` ou ser copiada para o frontend. A integração usa `generateContent` com JSON Schema e validação adicional no backend, conforme a [documentação oficial do Gemini](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

Após atualizar o projeto:

```powershell
cd backend
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
npm.cmd run build
npm.cmd start
```

Se o Windows informar que a DLL do Prisma está em uso, pare somente o backend deste projeto antes de executar `prisma:generate` e inicie-o novamente depois.

## Persistência e compatibilidade

- A tabela histórica `Lead` mantém os estabelecimentos encontrados, preservando campanhas, enriquecimento, exportação e rotas existentes. Ela representa o resultado de prospecção, e **não** define pertencimento ao CRM.
- `CrmLead` é a entrada comercial explícita criada por **Adicionar ao CRM**, com relação única a um estabelecimento. O Dashboard filtra essa relação e calcula os status por `CrmLead.stage`.
- `Website` pertence a `CrmLead`, com vínculo único. Não é possível gerar site para um estabelecimento que ainda não entrou no CRM. A geração concluída move apenas cards em `NEW` para `SITE_GENERATED`; outras etapas são preservadas.
- `StoredSite.document` persiste `seo`, `designPlan` e `files` (schemaVersion 2). Reads aceitam documentos v1 (dados sem `designPlan` recebem plano vazio).
- A migration `20260917000100_websites` é aditiva e não promove resultados antigos ao CRM.
- `revision` impede gravações concorrentes com versões antigas. Se outra aba alterar o site, o editor mantém a edição local e informa o conflito em vez de sobrescrever o banco.
- `published` guarda o snapshot público. A rota pública retorna apenas esse documento; não retorna notas do CRM nem o rascunho.
- Estados de geração: `pending`, `generating`, `completed`, `failed`. As gerações passam por uma fila em memória (`GenerationQueue`) que limita a concorrência a `MAX_CONCURRENT_GENERATIONS`: pedidos extras esperam e, por padrão, cada site usa **uma chamada ao Gemini** (criação completa) + no máximo uma chamada barata de correção se a validação estrutural falhar — nunca chamadas por seção. Erros temporários são repetidos com backoff exponencial (`MAX_RETRIES`). `GET /websites/queue` expõe o estado da fila. Na inicialização, sites `pending`/ativos de um processo anterior são retomados automaticamente; uma tentativa interrompida pode ser retomada depois de 150 segundos. Erros do provedor são apresentados sem expor a chave.

## Conteúdo e imagens

Dados de contato, endereço, nota, número de avaliações, horários e redes verificadas vêm do estabelecimento/Google Places. O enriquecimento também traz do Google Places a **descrição do lugar** (`editorialSummary`) e os **textos de avaliações reais com o nome dos autores** (até 6), repassados ao prompt do Gemini — que é instruído a nunca inventar fatos nem depoimentos; `SiteQuality` rejeita seções estruturais ausentes. Imagens vêm de fontes reais (Google Places, Instagram, Facebook, site do negócio) e provedores licenciados (Pexels, Pixabay, Unsplash) quando a própria empresa não tem foto. Não são inventadas fotos do estabelecimento nem depoimentos.

O formulário abre uma mensagem no WhatsApp para o visitante enviar; não simula entrega de mensagens. Configure o link do WhatsApp na ficha da empresa. O mapa usa o endereço preenchido.

## Verificação

```powershell
cd backend
npm.cmd test
npm.cmd run build
cd ../frontend
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Os testes de integração usam o PostgreSQL configurado e registros identificados por UUID, removidos ao final. As chamadas a Google Places e Gemini são simuladas nos testes; nenhuma chave real é usada ou cobrança gerada. O teste de navegador inicia servidores isolados nas portas 3002 e 5174. Opcionalmente, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pode apontar para um Chromium já instalado.

O teste real da API Gemini depende de preencher as variáveis acima. Domínios e subdomínios personalizados ainda não são configurados; a publicação atual usa `/s/:websiteId` no frontend, que precisa servir a aplicação SPA nessa rota.