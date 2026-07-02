# Deploy — Supabase + Railway

Este guia usa **Supabase** (Postgres gerenciado + Storage compatível com S3, numa conta só) e **Railway** (hospedagem da API e do Web, deploy via Docker). É a combinação recomendada para o orçamento e a escala de uma igreja: sem servidor pra administrar, tiers gratuitos/baratos, e o código já está pronto pros dois (`STORAGE_DRIVER=s3`, `Dockerfile` em `apps/api` e `apps/web`).

> Todos os passos abaixo que envolvem criar conta, clicar em botões no console ou copiar chaves precisam ser feitos por você no navegador — não tenho como fazer isso por vocês. As seções marcadas com **[VOCÊ FAZ]** são exatamente essas.

## 1. Banco de dados + Storage (Supabase) **[VOCÊ FAZ]**

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (escolha uma região próxima aos seus usuários).
2. **Connection strings do Postgres**: clique em **Connect** (topo do dashboard do projeto) → aba **ORM** → selecione **Prisma**. Copie as duas URLs mostradas:
   - `DATABASE_URL` — pooler em modo **transaction** (porta 6543, `pgbouncer=true`): usada pela aplicação em runtime.
   - `DIRECT_URL` — pooler em modo **session** (porta 5432): usada apenas pelo `prisma migrate` (o modo transaction não suporta prepared statements). O `schema.prisma` já está configurado para ler as duas.

   Troque `[YOUR-PASSWORD]` pela senha do banco que você definiu ao criar o projeto (ou redefina em *Project Settings → Database*).
3. **Bucket de mídia**: em *Storage*, crie um bucket chamado `media` e marque como **Public bucket** (os vídeos/thumbnails/legendas precisam ser publicamente legíveis para o player funcionar).
4. **Credenciais S3**: em *Project Settings → Storage → S3 Access Keys*, clique em "New access key" e guarde `Access Key ID` e `Secret Access Key`.
5. Anote o `project-ref` (aparece na URL do projeto, tipo `abcdefghijklm`). Com ele você monta:
   - `S3_ENDPOINT` = `https://<project-ref>.storage.supabase.co/storage/v1/s3`
   - `S3_PUBLIC_URL_BASE` = `https://<project-ref>.supabase.co/storage/v1/object/public/media`

## 2. Hospedagem (Railway) **[VOCÊ FAZ]**

1. Crie uma conta em [railway.app](https://railway.app) e conecte seu repositório GitHub (dá para usar a CLI/deploy manual também, mas GitHub é o caminho mais simples).
2. Crie um projeto novo com **dois serviços**, ambos apontando pro mesmo repositório:
   - **Serviço `api`**: Root Directory = raiz do repo, Dockerfile Path = `apps/api/Dockerfile`.
   - **Serviço `web`**: Root Directory = raiz do repo, Dockerfile Path = `apps/web/Dockerfile`.
3. Em cada serviço, configure as variáveis de ambiente (seção 3 abaixo).
4. Gere domínios públicos para os dois serviços (Railway oferece um subdomínio `*.up.railway.app` grátis, ou conecte um domínio próprio).

### Pegadinha real: porta do domínio gerado

O Railway injeta sua própria variável `PORT` em tempo de execução (não aparece na lista de Variables que você configura manualmente — é reservada da plataforma), e nosso código respeita esse valor (`env.PORT` sem hardcode). Ao clicar em **Generate Domain**, o Railway pergunta qual porta rotear — **não confie no valor do `.env.example`/Dockerfile (4000)**: depois de gerar o domínio, olhe os **Deploy Logs** do serviço, procure a linha `VMF API listening on http://localhost:XXXX` e confirme que a porta configurada no domínio (Settings → Networking → editar a porta ao lado do domínio) bate com esse valor. Se não bater, todo request retorna **502 "Application failed to respond"** mesmo com o deployment marcado como "Active"/"successful" — o container sobe normalmente, só o roteamento público é que fica errado.

### Domínio único — obrigatório para o login funcionar

O cookie de refresh token usa `SameSite=Lax`, o que só funciona entre web e API se os dois estiverem sob o **mesmo domínio registrável**. Configure domínios customizados assim:
- Web: `app.suaigreja.org`
- API: `api.suaigreja.org`

Se você usar os domínios genéricos do Railway (`web-production-xxxx.up.railway.app` e `api-production-yyyy.up.railway.app`), eles têm domínios registráveis **diferentes** e o login vai falhar silenciosamente (o navegador não envia o cookie de volta). Vale a pena configurar um domínio próprio antes de liberar para os membros.

## 3. Variáveis de ambiente

### Serviço `api` (Railway)

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` (Railway injeta a porta real via `PORT`, o Dockerfile já usa `process.env.PORT`) |
| `DATABASE_URL` | connection string do pooler transaction (passo 1.2) |
| `DIRECT_URL` | connection string do pooler session (passo 1.2) — só usada pelo `prisma migrate` |
| `JWT_ACCESS_SECRET` | gere com `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | gere com `openssl rand -base64 48` (diferente do access) |
| `COOKIE_SECRET` | gere com `openssl rand -base64 48` |
| `WEB_ORIGIN` | `https://app.suaigreja.org` |
| `STORAGE_DRIVER` | `s3` |
| `S3_ENDPOINT` | `https://<project-ref>.storage.supabase.co/storage/v1/s3` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | `media` |
| `S3_ACCESS_KEY_ID` | do passo 1.4 |
| `S3_SECRET_ACCESS_KEY` | do passo 1.4 |
| `S3_PUBLIC_URL_BASE` | `https://<project-ref>.supabase.co/storage/v1/object/public/media` |
| `S3_FORCE_PATH_STYLE` | `true` |
| `TRANSCODE_CONCURRENCY` | `1` |
| `TRANSCODE_TIMEOUT_MINUTES` | `60` |

`ffmpeg`/`ffprobe` já vêm instalados na imagem Docker (`apps/api/Dockerfile`), não precisa configurar `FFMPEG_PATH`/`FFPROBE_PATH`.

### Serviço `web` (Railway)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.suaigreja.org` — **precisa ser configurada como build-arg**, não só como env var de runtime (ver nota abaixo) |

**Nota importante sobre `NEXT_PUBLIC_API_URL`**: o Next.js grava esse valor dentro do JavaScript enviado ao navegador *durante o build*, não lê em tempo de execução. No Railway, isso significa configurar a variável em *Settings → Variables* normalmente é suficiente **somente se** o builder do Railway propagar variáveis `NEXT_PUBLIC_*` como build args automaticamente (ele faz isso por padrão para builds Docker). Se depois do deploy o app continuar chamando `localhost:4000`, configure manualmente em *Settings → Build → Docker Build Args*: `NEXT_PUBLIC_API_URL=https://api.suaigreja.org`.

## 4. Rodar as migrations em produção

Depois que o serviço `api` subir pela primeira vez (mesmo que ainda com erro por falta de tabelas), rode as migrations contra o banco do Supabase. Você pode fazer isso de duas formas:

**Opção A — do seu computador**, usando as mesmas `DATABASE_URL`/`DIRECT_URL` de produção (o `prisma migrate deploy` usa `DIRECT_URL` automaticamente, já que está declarada no `schema.prisma`):
```
cd apps/api
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true" DIRECT_URL="postgresql://...:5432/postgres" npx prisma migrate deploy
```

**Opção B — via Railway CLI**, rodando dentro do ambiente do serviço:
```
railway run --service api npx prisma migrate deploy
```

Depois, popule os dados iniciais (categorias + usuário admin):
```
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true" DIRECT_URL="postgresql://...:5432/postgres" SEED_ADMIN_EMAIL="admin@suaigreja.org" SEED_ADMIN_PASSWORD="escolha-uma-senha-forte" npx prisma db seed
```

**Troque a senha do admin no primeiro login** — o seed usa uma senha padrão previsível se as variáveis `SEED_ADMIN_*` não forem passadas.

## 5. Checklist final

- [ ] Bucket `media` criado e marcado como público no Supabase
- [ ] `DATABASE_URL` e `DIRECT_URL` configuradas no serviço `api`
- [ ] `STORAGE_DRIVER=s3` e credenciais S3 configuradas no serviço `api`
- [ ] Domínios customizados sob o mesmo domínio registrável (`app.` e `api.` do mesmo domínio)
- [ ] `NEXT_PUBLIC_API_URL` aplicado como build-arg no serviço `web` (confirme inspecionando o JS enviado ao navegador, ou testando login)
- [ ] `prisma migrate deploy` + seed rodados contra o banco de produção
- [ ] Senha do admin trocada após o primeiro login
- [ ] Teste de ponta a ponta: cadastro, login, upload de vídeo (confirma que o ffmpeg + S3 estão funcionando), download offline

## Custo aproximado

- Supabase: gratuito até 500MB de banco e 1GB de storage; planos pagos a partir de ~US$25/mês quando passar disso.
- Railway: cobra por uso (CPU/RAM/rede); dois serviços pequenos ficam tipicamente na faixa de US$5–20/mês dependendo do tráfego.

Sem custo fixo de servidor 24/7 dedicado como teria com GCP Cloud SQL, e sem necessidade de administrar SO/patches.
