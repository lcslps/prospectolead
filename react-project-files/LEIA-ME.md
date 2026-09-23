# Onde colocar cada arquivo

Você já tem o projeto React + TypeScript + Tailwind criado. Copie estas pastas por cima do seu projeto,
mantendo a mesma estrutura:

```
seu-projeto/
├── src/
│   ├── App.tsx              ← substitui o seu App.tsx
│   ├── index.css            ← substitui/mescla com o seu index.css (ou src/main.css)
│   ├── types.ts             ← novo
│   ├── lib/
│   │   ├── gemini.ts        ← novo
│   │   ├── cloudflare.ts    ← novo
│   │   └── prompts.ts       ← novo
│   └── components/
│       ├── ApiKeyPanel.tsx  ← novo
│       ├── BusinessForm.tsx ← novo
│       └── PreviewPanel.tsx ← novo
└── server/                  ← pasta NOVA, backend Node.js separado do frontend
    ├── index.js
    ├── package.json
    └── .env.example
```

## 1. Frontend (React)

1. Copie `src/App.tsx`, `src/types.ts`, `src/lib/*` e `src/components/*` para dentro do `src/` do seu
   projeto (substituindo o `App.tsx` que o Vite/CRA gerou por padrão).
2. Abra o seu `src/index.css` (ou o arquivo onde estão as diretivas `@tailwind base; @tailwind components;
   @tailwind utilities;`) e cole a linha de `@import` de fontes do Google **antes** das diretivas do
   Tailwind, exatamente como está no `src/index.css` que mandei — imports de CSS sempre precisam vir
   primeiro no arquivo.
3. Confirme que `src/main.tsx` (ou `index.tsx`) importa esse CSS, ex:
   ```ts
   import './index.css';
   ```
4. Rode o frontend normalmente: `npm run dev`.

Nenhuma dependência nova é necessária no frontend — é tudo `fetch` nativo do navegador, sem SDKs.

## 2. Backend (Node.js)

O backend é o responsável por chamar o Cloudflare Workers AI (é ele quem guarda o `CLOUDFLARE_API_TOKEN`
em segredo; o token nunca deve aparecer no frontend/React).

1. Crie uma pasta `server/` na raiz do seu projeto (fora da pasta `src/`, no mesmo nível do
   `package.json` do React) e coloque `index.js`, `package.json` e `.env.example` dentro dela.
2. Dentro da pasta `server/`, rode:
   ```
   npm install
   ```
3. Copie `.env.example` para `.env` (ainda dentro de `server/`) e preencha:
   ```
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_API_TOKEN=...
   PORT=3001
   ```
4. Inicie o backend:
   ```
   npm start
   ```
   Ele sobe em `http://localhost:3001` e expõe só duas rotas:
   - `GET /api/cloudflare/status` — checa se as credenciais estão configuradas
   - `POST /api/image` — recebe `{ prompt, model, width, height }` e devolve `{ dataUrl }`

5. Com o backend rodando, abra o frontend (`npm run dev`, normalmente `http://localhost:5173`), cole sua
   API key do Gemini na interface, confira se o campo "Backend Cloudflare" (em Configurações avançadas)
   está apontando para `http://localhost:3001`, clique em "Testar" e depois em "Gerar site".

## Resumo do fluxo

- O **Gemini** é chamado direto do navegador (React), usando a API key que você cola na interface —
  ele gera a estrutura do site, a copy e os prompts das imagens.
- O **Cloudflare Workers AI (FLUX.2)** é chamado pelo **backend Node.js**, nunca pelo navegador —
  é assim que o token da Cloudflare fica protegido.
- O backend e o frontend são dois processos separados: `server/` (Node.js, porta 3001) e o projeto React
  (Vite, porta 5173 por padrão). Em produção, você pode publicar o `server/` em qualquer host Node
  (Railway, Render, Fly.io etc.) e apontar o campo "Backend Cloudflare" do frontend para essa URL pública.
