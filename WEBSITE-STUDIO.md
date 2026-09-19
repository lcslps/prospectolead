# Prospecção, CRM e sites

## Arquitetura do gerador de sites

O gerador usa `SiteDocument` (schemaVersion 1) como fonte de verdade. A IA atua somente como diretora criativa: ela escolhe tema, direção de arte, seções, variantes, conteúdo seguro e pedidos semânticos de imagem. Ela não produz HTML, CSS, JSX, React nem valores visuais arbitrários.

Antes de chamar a IA, o motor cria um `Blueprint` determinístico a partir da classificação semântica do negócio, das evidências verificadas e de uma semente estável do lead. O blueprint define objetivo, CTA, objeto-herói, ritmo, paleta, tipografia, receita de layout, seções que fazem sentido e plano de mídia. O `QualityGuard` remove seções vazias e texto inseguro ou inventado antes de persistir.

```
Lead no CRM → BusinessNormalizer → AI Site Planner → SiteDocument validado
→ QualityGuard → ImageResolver → Website / WebsiteVersion → SiteRenderer
→ Editor, preview e site publicado
```

- `backend/src/services/websiteSchema.ts` define o documento, links seguros, tokens e limites.
- `backend/src/services/SectionRegistry.ts` é o catálogo serializável de seções e variantes permitidas.
- `backend/src/services/BusinessNormalizer.ts` transforma dados do CRM/Google Places no formato interno seguro.
- `backend/src/services/QualityGuard.ts` impede variantes desconhecidas, links perigosos, imagens duplicadas e garante Hero e Footer.
- `WebsiteVersion` registra checkpoints de geração, edição e publicação. `WebsiteAsset` reserva metadados de origem de imagens por site.
- O mesmo `WebsiteRenderer` é usado no editor, preview e rota pública; alterações simples atualizam somente o documento.

Para adicionar uma seção, inclua o tipo no schema, registre variantes e limites em `SectionRegistry`, implemente a apresentação determinística no renderer e exponha os campos no editor. Para adicionar tema, inclua seu nome e tokens semânticos no schema/preset; nunca aceite CSS produzido pela IA.

## Como usar

1. Pesquise em **Prospecção** e abra **Resultados da prospecção**.
2. Clique em **Enviar para o CRM** (ou **Adicionar ao CRM** nos detalhes).
3. Abra o card no **CRM** e clique em **Gerar site com IA**.
4. No editor, selecione uma seção na lista ou diretamente na prévia. Edite os campos à direita. As alterações são salvas após 900 ms de pausa.
5. Use **Interagir** para testar links, perguntas e formulário. **Visualizar** amplia a prévia. Há modos desktop, tablet e celular e controle de zoom.
6. **Pedir à IA** cria uma sugestão para título, descrição, texto, seção ou estrutura. A sugestão só altera o rascunho ao clicar em **Aplicar sugestão**.
7. **Publicar** salva uma versão pública, acessível em `/s/:websiteId`. Alterações posteriores continuam no rascunho até uma nova publicação.

## Configuração

No `backend/.env`, preencha:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_THINKING_LEVEL=low
```

`GEMINI_THINKING_LEVEL` aceita `low`, `medium` ou `high` e controla o nível de raciocínio do modelo.

Use um modelo disponível na sua conta com suporte a saída estruturada. Reinicie o backend após alterar o `.env`. Nenhuma dessas variáveis deve receber prefixo `VITE_` ou ser copiada para o frontend. A integração usa `generateContent` com JSON Schema e validação adicional no backend, conforme a [documentação oficial do Gemini](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

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
- `WebsiteSection` guarda tipo, posição, visibilidade, conteúdo e estilo. IDs permanecem estáveis durante edição; duplicações recebem novos IDs.
- A migration `20260917000100_websites` é aditiva e não promove resultados antigos ao CRM.
- `revision` impede gravações concorrentes com versões antigas. Se outra aba alterar o site, o editor mantém a edição local e informa o conflito em vez de sobrescrever o banco.
- `published` guarda o snapshot público. A rota pública retorna apenas esse documento; não retorna notas do CRM nem o rascunho.
- Estados de geração: `pending`, `generating`, `completed`, `failed`. Uma tentativa interrompida pode ser retomada depois de 150 segundos. Erros do provedor são apresentados sem expor a chave.

## Conteúdo e imagens

Dados de contato, endereço, nota e número de avaliações vêm do estabelecimento. Campos desconhecidos ficam vazios. O Gemini recebe instruções para não inventar informações. Itens factuais gerados só são aceitos quando seus textos estão presentes nos dados fornecidos; revise os textos comerciais antes de publicar.

O editor aceita URLs HTTPS e upload de PNG, JPEG e WebP até 2 MB por imagem. Os uploads ficam incorporados ao documento persistido no banco, incluindo o snapshot publicado. O limite total de uma gravação é 12 MB; para galerias maiores, use URLs HTTPS. Não são inventadas fotos do estabelecimento nem depoimentos. Campos de imagem começam vazios quando não há uma imagem disponível.

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
