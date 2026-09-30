# Resolve Aí — Frontend

Interface web da plataforma de gestão de ocorrências **Resolve Aí** (Hackathon POSTECH FSDT, Fase 5).

A API e a documentação completa (arquitetura, diagramas, endpoints e deploy) estão em [hackathon-fiap-backend](https://github.com/joaopxt/hackathon-fiap-backend).

| | |
|---|---|
| Stack | Next.js 15 (App Router) + React 19 + Tailwind 4 |
| Deploy | **Vercel** |
| Variável | `NEXT_PUBLIC_API_URL`: URL pública da API |

## Telas

- **Login / Cadastro**
- **Ocorrências**: o solicitante vê as próprias e o gestor vê todas, com filtros por status, categoria, prioridade, responsável e busca.
- **Nova ocorrência**: título, descrição, categoria, localização (texto e GPS) e foto. A foto é redimensionada no navegador antes do envio.
- **Detalhe**: descrição, imagem, solução, avaliação, comentários e histórico de status. O gestor também tem o painel de prioridade, responsável e status.
- **Dashboard** (gestor): indicadores por status, categoria e prioridade, tempo médio de resolução e avaliação média.
- **Usuários** (gestor): promover solicitantes a gestor.

## Rodando localmente

Pré-requisito: a API rodando (veja o repositório do backend).

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

```bash
npm run lint    # checagem de tipos
npm test        # testes (Vitest)
npm run build   # build de produção
```

## Deploy na Vercel

1. Importe este repositório na Vercel. O framework Next.js é detectado sozinho.
2. Defina `NEXT_PUBLIC_API_URL` com a URL da API (ex.: `https://api.seudominio.com`).
3. Faça o deploy. Se mudar a variável depois, é preciso fazer **Redeploy**, porque ela é embutida no build.
