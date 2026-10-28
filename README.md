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

## Como executar localmente

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Para gerar o build de produção:

```bash
npm run build
npm start
```

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
