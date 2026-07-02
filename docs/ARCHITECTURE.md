# Arquitetura

Plataforma de streaming interna para igreja: vídeos, treinamentos, conteúdos de texto e eventos, com área de membros (estilo Netflix/Spotify) e painel administrativo, em pt-BR/en-US/es-ES.

## Visão geral

```
VMF/
  apps/api/       Backend Node.js (Fastify + Prisma + PostgreSQL)
  apps/web/       Frontend Next.js (App Router, PWA)
  packages/shared/ Schemas Zod + tipos TypeScript usados pelos dois
```

Monorepo com **npm workspaces**, sem Docker Compose/Turborepo — `packages/shared` não tem passo de build próprio, é consumido como TypeScript-fonte diretamente (via `tsx` na API, via `transpilePackages` no Next).

## Backend (`apps/api`)

- **Fastify 5 + TypeScript**, organizado por módulo de feature em `src/modules/<nome>/`: cada um tem `*.service.ts` (Prisma + regras de negócio) e `*.routes.ts` (HTTP).
- **Prisma + PostgreSQL** — schema em `apps/api/prisma/schema.prisma`. Entidades principais: `User`, `Category`, `Video`, `Subtitle`, `TextContent`, `Training`/`TrainingModule`/`TrainingLesson`/`TrainingProgress`, `Event`, `Favorite`, `ViewHistory`, `OfflineDownload`, `Banner`, `RefreshToken`, `PasswordResetToken`.
- **Autenticação**: JWT de acesso (Bearer, 15 min, `@fastify/jwt`) + refresh token opaco em cookie httpOnly (`@fastify/cookie`, `SameSite=Lax`, rotação a cada refresh). RBAC simples via enum `Role` (`ADMIN`/`MEMBER`) e guard genérico `app.authorize([...roles])`.
- **Storage de mídia**: interface `StorageService` (`src/lib/storage/storage.service.ts`) com dois drivers:
  - `local` (padrão, dev): grava em `apps/api/uploads/`, servido via `@fastify/static` em `/media`.
  - `s3`: publica em qualquer backend compatível com S3 (Supabase Storage, Backblaze B2, R2...) via `@aws-sdk/client-s3`. Escolhido por `STORAGE_DRIVER` no `.env`.
  - Em ambos os casos, o `ffmpeg` sempre escreve num diretório local "scratch" (`src/lib/storage/scratch.ts`) primeiro — ele precisa de um caminho de filesystem real — e o resultado é publicado pelo driver configurado.
- **Upload e transcodificação de vídeo**: `@fastify/multipart` recebe o arquivo, salva no scratch local, marca `transcodeStatus=PENDING` e enfileira um job (`src/modules/videos/transcode/transcode.queue.ts`) com `p-limit` limitando concorrência (padrão 1). O worker roda `ffmpeg` gerando uma renditação HLS 720p + thumbnail, sobe pro storage configurado e atualiza o `Video` no banco. No boot da API, um *recovery sweep* reenfileira vídeos presos em `PENDING`/`PROCESSING` (útil se o processo reiniciar no meio de um job, já que a fila vive em memória).
- **Legendas**: upload de `.srt` ou `.vtt`; SRT é convertido pra VTT com a lib `subtitle`.
- **Validação**: schemas Zod compartilhados de `packages/shared`, parseados nos handlers; erros viram HTTP 400 com detalhe de campo.

## Frontend (`apps/web`)

- **Next.js App Router**, rotas sob `[locale]` (`pt-BR`/`en-US`/`es-ES`) via `next-intl`, com middleware de detecção/redirecionamento de idioma.
- Três grupos de rotas:
  - `(public)`: login, cadastro, recuperação de senha.
  - `(member)`: home, vídeos, treinamentos, conteúdos, eventos, busca, favoritos, downloads, perfil — protegido por `AuthGuard` client-side.
  - `(admin)`: dashboard, categorias, usuários, vídeos, conteúdos, treinamentos, eventos, banners — protegido por `AuthGuard` com `requireRole="ADMIN"`.
- **Autenticação no cliente**: `AuthProvider` guarda o access token em memória (nunca em `localStorage`) e tenta um refresh via cookie no mount para restaurar sessão entre reloads. `apiFetch` (`src/lib/api-client.ts`) intercepta 401 e tenta um refresh automático antes de propagar o erro.
- **Regra de arquitetura**: Server Components só buscam dado público (nada autenticado); qualquer tela com dado do usuário é Client Component consumindo o `AuthProvider`. Isso evita a complexidade de repassar cookies httpOnly através do SSR do Next.
- **Player de vídeo**: `hls.js` para navegadores sem suporte nativo a HLS, com fallback para Safari (`canPlayType`). Legendas via `<track>`.
- **Calendário de eventos**: feito à mão com `date-fns` (mês/semana/lista), sem lib pesada.
- **PWA**: `@serwist/next` gera o service worker (`src/app/sw.ts`), desabilitado em dev. Downloads offline são implementados manualmente: `src/lib/offline/download-video.ts` baixa o `.m3u8` + segmentos `.ts` e grava no Cache Storage (mesmo cache que o service worker usa como `CacheFirst` para `/media/hls/`), com o manifesto de "o que foi baixado" em IndexedDB (`src/lib/idb/downloads-db.ts`).

## Comunicação web ↔ API

Dois apps separados (portas/domínios diferentes), não é um monólito Next.js full-stack. Em dev, `localhost:3000` e `localhost:4000` (ou `:3001` se a `:3000` estiver ocupada) são *same-site*, então o cookie de refresh funciona sem CORS/cookie drama. **Em produção isso exige que web e API fiquem sob o mesmo domínio registrável** (ex. `app.igreja.org` + `api.igreja.org`) — ver `docs/DEPLOYMENT.md`.

## Simplificações conscientes do MVP

- Recuperação de senha sem SMTP real: token logado no console da API.
- Busca via `ILIKE` do Postgres, sem motor de busca dedicado.
- Fila de transcode em memória (sem Redis/BullMQ), com concorrência limitada + recovery sweep + timeout como redes de segurança.
- Sem testes automatizados/CI — validação manual por fase durante o desenvolvimento.
- RBAC simples (enum de papel), não uma ACL genérica.
- Fora de escopo: multi-tenant, antivírus/moderação de upload, notificações push reais, pagamentos.
