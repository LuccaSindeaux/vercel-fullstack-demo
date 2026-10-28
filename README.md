# Vercel Fullstack Demo

Aplicação de demonstração acadêmica que mostra, na prática, como a **Vercel** hospeda uma aplicação **Fullstack** a partir de um único repositório: o frontend React e a API Serverless em Node.js convivem no mesmo projeto Next.js e são publicados juntos a cada `git push`.

## Objetivo

- Demonstrar uma **Serverless Function** real respondendo a requisições `GET` e `POST`.
- Exibir os **headers da Edge Network** que a Vercel injeta em cada requisição (geolocalização, ID da requisição, região).
- Servir como material de apoio para explicar o fluxo **Git → Vercel CI/CD** (Production e Preview Deployments).

## Arquitetura Fullstack

```
src/app/
├── layout.tsx                  # Layout raiz e metadados (SEO)
├── page.tsx                    # FRONTEND: dashboard React (Client Component)
└── api/telemetry/route.ts      # BACKEND: Serverless Function (GET e POST)
```

| Camada | Arquivo | Onde executa |
| --- | --- | --- |
| Frontend | `src/app/page.tsx` | No navegador do usuário (Client Component com `"use client"`), servido pela CDN da Vercel |
| Backend | `src/app/api/telemetry/route.ts` | Em uma Serverless Function Node.js, criada automaticamente pela Vercel a partir do Route Handler |

O frontend chama a API com `fetch("/api/telemetry")` — mesma origem, sem CORS e sem servidor separado.

### Endpoints

**`GET /api/telemetry`** — retorna o status da função e os headers da Edge Network:

```json
{
  "status": "Online & Healthy",
  "environment": "production",
  "region": "gru1",
  "timestamp": "2026-10-28T18:00:00.000Z",
  "nodeVersion": "v22.x",
  "headers": {
    "x-vercel-ip-country": "BR",
    "x-vercel-ip-city": "Porto Alegre",
    "x-vercel-ip-timezone": "America/Sao_Paulo",
    "x-vercel-id": "gru1::iad1::abcde-1234567890",
    "x-forwarded-for": "200.0.0.1"
  }
}
```

**`POST /api/telemetry`** — recebe `{ "message": string, "author"?: string }` e simula um processamento: tamanho do payload em bytes, contagem de palavras, transformação em maiúsculas e geração de um ID de execução aleatório.

## Headers da Edge Network: Produção vs Localhost

Quando o site está publicado, toda requisição passa primeiro pela **Edge Network** da Vercel, que adiciona headers antes de encaminhá-la para a Serverless Function:

| Header | Em Produção (Vercel) | Em Localhost (`npm run dev`) |
| --- | --- | --- |
| `x-vercel-ip-country` | País do visitante (ex.: `BR`) | Ausente → fallback `BR (Localhost Fallback)` |
| `x-vercel-ip-city` | Cidade do visitante | Ausente → fallback `Porto Alegre (Dev)` |
| `x-vercel-ip-timezone` | Fuso horário do visitante | Ausente → fallback `America/Sao_Paulo (Dev)` |
| `x-vercel-id` | ID único da requisição, com as regiões de Edge e da função (ex.: `gru1::iad1::...`) | Ausente → fallback `dev1::gru1-12345` |
| `x-forwarded-for` | IP real do cliente | `127.0.0.1` ou `::1` |

Da mesma forma, as variáveis `VERCEL_ENV` (`production`, `preview` ou `development`) e `VERCEL_REGION` (ex.: `gru1`) só existem na infraestrutura da Vercel; localmente a API usa `development` e `local-machine`.

> Ou seja: **localmente não existe Edge Network**. Os valores de fallback permitem desenvolver a interface normalmente, e os dados reais aparecem assim que o projeto é publicado.

## Como ativar o projeto (passo a passo)

### 1. Pré-requisitos

| Ferramenta | Versão | Como verificar |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | **20.9 ou superior** (recomendado: LTS) | `node -v` |
| npm | vem com o Node.js | `npm -v` |
| [Git](https://git-scm.com) | qualquer versão recente | `git --version` |
| Conta no [GitHub](https://github.com) | — | necessária para o deploy |
| Conta na [Vercel](https://vercel.com/signup) | plano Hobby (gratuito) é suficiente | pode entrar usando a conta do GitHub |

> Nenhuma variável de ambiente ou chave de API é necessária: o projeto funciona sem configuração extra.

### 2. Rodar localmente

```bash
# Clonar o repositório
git clone https://github.com/LuccaSindeaux/vercel-fullstack-demo.git
cd vercel-fullstack-demo

# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O dashboard carrega a telemetria automaticamente e exibe os **valores de fallback** (ex.: `BR (Localhost Fallback)`), pois localmente não existe Edge Network.

Para testar a API diretamente:

```bash
# GET
curl http://localhost:3000/api/telemetry

# POST
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá turma de Fullstack!", "author": "Turma"}'
```

Para simular o build de produção localmente:

```bash
npm run build   # compila e valida TypeScript
npm start       # serve o build em http://localhost:3000
npm run lint    # (opcional) verifica o código com ESLint
```

### 3. Enviar o código para o GitHub

Se o repositório ainda não estiver no GitHub, crie um repositório vazio em [github.com/new](https://github.com/new) e rode:

```bash
git remote add origin https://github.com/<seu-usuario>/vercel-fullstack-demo.git   # só se ainda não houver "origin"
git push -u origin main
```

### 4. Publicar na Vercel

**Opção A — Pelo painel (recomendado):**

1. Acesse [vercel.com/new](https://vercel.com/new) e conecte sua conta do GitHub.
2. Clique em **Import** no repositório `vercel-fullstack-demo`.
3. A Vercel detecta o **Next.js** automaticamente — não altere nada (Build Command, Output Directory e Install Command já vêm preenchidos).
4. Clique em **Deploy** e aguarde cerca de 1 minuto.
5. Abra a URL gerada (ex.: `https://vercel-fullstack-demo.vercel.app`).

**Opção B — Pela linha de comando:**

```bash
npm i -g vercel
vercel login
vercel          # cria um Preview Deployment
vercel --prod   # publica em Produção
```

### 5. Conferir se tudo está funcionando

Na URL publicada, verifique:

- [ ] O badge no topo mostra **Production**.
- [ ] Os cards exibem seu **país e cidade reais** (`x-vercel-ip-country`, `x-vercel-ip-city`) em vez dos valores de fallback.
- [ ] `x-vercel-id` e `VERCEL_REGION` mostram regiões reais (ex.: `gru1`, `iad1`).
- [ ] O botão **"Disparar Nova Requisição GET"** atualiza os dados e mostra a latência em ms.
- [ ] O formulário **"Enviar POST para Serverless"** retorna o JSON processado.
- [ ] Em **Vercel → Projeto → Logs**, aparecem as invocações da função `/api/telemetry`.

### 6. Testar Preview Deployments

```bash
git checkout -b teste-preview
# faça qualquer alteração, por exemplo em src/app/page.tsx
git commit -am "teste: preview deployment"
git push -u origin teste-preview
```

Abra um Pull Request no GitHub: a Vercel comenta no PR com uma **URL de Preview** exclusiva, e o badge do dashboard mostra **Preview**. Ao fazer merge na `main`, a alteração vai para Produção automaticamente.

### Problemas comuns

| Problema | Solução |
| --- | --- |
| `npm install` falha ou o build reclama da versão do Node | Atualize para Node.js 20.9+ (`node -v`). |
| Porta 3000 ocupada | `npm run dev -- -p 3001` |
| Cards mostram "Localhost Fallback" em produção | Normal apenas localmente; na Vercel, confirme que está acessando a URL `*.vercel.app` (e não um proxy que remova os headers). |
| Badge mostra **Development** na Vercel | Verifique se o deploy foi feito pela Vercel (a variável `VERCEL_ENV` é definida automaticamente por ela). |

## Fluxo de CI/CD: Git → Vercel

1. O repositório é importado na Vercel (ou conectado via GitHub/GitLab/Bitbucket). O framework Next.js é detectado automaticamente — **zero configuração**.
2. **Production Deployment:** cada push na branch de produção (`main`) dispara build e deploy automáticos para a URL principal. Aqui `VERCEL_ENV=production`.
3. **Preview Deployment:** cada push em outra branch ou Pull Request gera uma **URL exclusiva e isolada**, ideal para revisar mudanças antes do merge. Aqui `VERCEL_ENV=preview` e o badge do dashboard mostra **Preview**.
4. Ao fazer merge do Pull Request na `main`, a nova versão é promovida para produção.
5. As Serverless Functions **escalam automaticamente** conforme a demanda e ficam ociosas (scale-to-zero) quando não há tráfego.

```
git push (feature-branch) ──► Preview Deployment  (URL única por commit/PR)
git push (main)           ──► Production Deployment (domínio principal)
```

## Tecnologias

- [Next.js](https://nextjs.org) (App Router, Route Handlers)
- React + TypeScript
- Tailwind CSS (sem bibliotecas de UI ou ícones externas — apenas SVG inline)
- [Vercel](https://vercel.com) (hospedagem, Edge Network e Serverless Functions)
