# Build context: raiz do repositorio. Exemplo: docker build -f apps/web/Dockerfile -t vmf-web .
# NEXT_PUBLIC_API_URL precisa ser passado como build-arg: o Next.js inclui esse
# valor no bundle do navegador em tempo de build, nao em tempo de execucao.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY packages/shared packages/shared
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# packages/shared aponta "main" para dist/ (necessario pro Metro do app mobile
# conseguir consumir o pacote) - dist/ e gitignored, entao precisa ser buildado
# aqui, senao o build do Next.js nao acha @vmf/shared.
RUN npm run build -w packages/shared

RUN npm run build -w apps/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Nao fixar PORT aqui: plataformas como Railway injetam sua propria PORT em
# tempo de execucao, e um valor hardcoded no Dockerfile pode conflitar com
# ela dependendo de como a plataforma mescla env vars. server.js (gerado pelo
# output "standalone" do Next.js) le process.env.PORT e cai para 3000 sozinho
# se nada for definido, entao nao precisamos de um default aqui.

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Apenas documentacao (nao afeta roteamento real, que depende da PORT em runtime).
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
