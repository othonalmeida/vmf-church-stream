# VMF Church Stream

Plataforma de streaming interna para igreja — vídeos, treinamentos, conteúdos de texto e eventos — com área de membros (estilo Netflix/Spotify) e painel administrativo, em português, inglês e espanhol.

Veja também: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (decisões técnicas) e [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (deploy em produção com Supabase + Railway).

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, next-intl, hls.js, Serwist (PWA).
- **Backend**: Node.js, Fastify, TypeScript, Prisma.
- **Banco**: PostgreSQL.
- **Storage**: disco local (dev) ou qualquer serviço compatível com S3 — Supabase Storage, Backblaze B2 etc. (produção).
- **Streaming**: HLS gerado via `ffmpeg` no upload.

## Pré-requisitos

- Node.js ≥ 20.9
- Uma instância PostgreSQL (local, Neon, Supabase...) — veja abaixo como conseguir uma gratuita
- `ffmpeg` e `ffprobe` instalados e no `PATH` (necessário para upload/transcodificação de vídeo; o resto da aplicação funciona sem eles)

## Instalação

```bash
npm install
```

## Configuração

Copie os arquivos de exemplo e preencha:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Em `apps/api/.env`, o mínimo obrigatório é `DATABASE_URL` (Postgres) e os três segredos (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — gere cada um com `openssl rand -base64 48`). Se não tiver um Postgres ainda, o jeito mais rápido é criar um projeto gratuito em [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com) e colar a connection string.

Em `apps/web/.env.local`, confirme que `NEXT_PUBLIC_API_URL` aponta para onde a API vai rodar (`http://localhost:4000` por padrão).

## Banco de dados

```bash
npm run prisma:migrate   # cria as tabelas
npm run prisma:seed      # cria um admin, um membro e dados de exemplo
```

O seed imprime no terminal o e-mail e a senha inicial do admin e do membro criados (troque a senha do admin no primeiro login). Para customizar, defina `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_MEMBER_EMAIL`, `SEED_MEMBER_PASSWORD` antes de rodar o seed.

## Rodando em desenvolvimento

```bash
npm run dev
```

Sobe a API (`http://localhost:4000`) e o Web (`http://localhost:3000`, ou a próxima porta livre) juntos via `concurrently`. Também dá pra rodar cada um separado com `npm run dev:api` / `npm run dev:web`.

## Upload de vídeo e mídia

Com `ffmpeg`/`ffprobe` instalados e configurados (`FFMPEG_PATH`/`FFPROBE_PATH` no `.env`, ou apenas no `PATH`), o fluxo é: painel admin → Vídeos → criar metadados → enviar arquivo → a API transcodifica para HLS em segundo plano (acompanhe o status na listagem). Por padrão os arquivos ficam em `apps/api/uploads/`, servidos em `/media`. Para produção, troque `STORAGE_DRIVER=local` por `STORAGE_DRIVER=s3` (ver `docs/DEPLOYMENT.md`) — discos locais de plataformas como Railway/Render não são persistentes entre deploys.

## Verificação de tipos

```bash
npm run typecheck
```

## Build de produção

```bash
npm run build -w apps/web   # gera .next/standalone
npm run build -w apps/api   # apenas type-check; a API roda via tsx tanto em dev quanto em produção
```

Dockerfiles prontos em `apps/api/Dockerfile` e `apps/web/Dockerfile` (contexto de build = raiz do repositório).

## Publicar (deploy)

Guia completo passo a passo em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), usando Supabase (Postgres + Storage) e Railway (hospedagem).

## Idiomas

pt-BR, en-US e es-ES. Textos fixos da interface do membro em `apps/web/messages/*.json`. O painel administrativo permanece em português nesta versão (uso interno da equipe da igreja) — próxima fase natural é estender os mesmos arquivos de mensagem para lá.

## Próximas fases (fora do MVP)

- Download offline com proteção de DRM mais forte (hoje: Cache Storage + IndexedDB, funcional mas sem criptografia)
- Transcodificação com múltiplas qualidades (ABR) e legendas geradas automaticamente
- Revisão manual de legendas, notificações push reais, relatórios avançados
- Grupos de membros e conteúdo restrito por grupo
- App mobile nativo (React Native)
- Integração com meios de pagamento (assinaturas, cursos pagos, contribuições)
