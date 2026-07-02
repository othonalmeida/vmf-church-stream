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

RUN npm run prisma:generate -w apps/api

ENV NODE_ENV=production
ENV PORT=4000
ENV FFMPEG_PATH=ffmpeg
ENV FFPROBE_PATH=ffprobe
EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]
