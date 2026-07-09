# Build context: raiz do repositorio (necessario para o npm workspaces resolver
# @vmf/shared). Exemplo: docker build -f apps/api/Dockerfile -t vmf-api .
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api

# packages/shared aponta "main" para dist/ (necessario pro Metro do app mobile
# conseguir consumir o pacote) - dist/ e gitignored, entao precisa ser buildado
# aqui, senao apps/api nao acha @vmf/shared em runtime.
RUN npm run build -w packages/shared

RUN npm run prisma:generate -w apps/api

# Scratch local sempre necessario (ffmpeg/upload leem e escrevem aqui antes de
# publicar no storage configurado), mesmo quando STORAGE_DRIVER=s3.
RUN mkdir -p apps/api/uploads

ENV NODE_ENV=production
# Nao fixar PORT: plataformas como Railway injetam a propria em runtime, e
# src/env.ts ja tem um default (4000) para quando nada for fornecido (ex:
# docker run local sem -e PORT).
ENV FFMPEG_PATH=ffmpeg
ENV FFPROBE_PATH=ffprobe
# Apenas documentacao (nao afeta roteamento real, que depende da PORT em runtime).
EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]
