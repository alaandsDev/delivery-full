# Deploy com Vercel, Render e Supabase

Esta base foi simplificada para um fluxo de publicacao mais rapido:

- `frontend/`: Next.js no Vercel
- `backend/`: NestJS no Render
- `database`: Supabase Postgres com Prisma
- `uploads`: Cloudinary

## 1. Banco no Supabase

1. Crie um projeto em [Supabase](https://supabase.com/).
2. Em `Project Settings > Database`, copie:
   - `Connection string` para `DATABASE_URL`
   - `Direct connection string` para `DIRECT_URL`
3. Use o mesmo banco para o Prisma no backend.

## 2. Backend no Render ou Railway

1. Suba este repositorio no GitHub.
2. No Render, crie um `Web Service`, ou no Railway crie um service apontando para `backend`.
3. Aponte o `Root Directory` para `backend`.
4. Use os comandos:

```bash
npm install && npm run prisma:generate && npm run prisma:deploy && npm run build
```

```bash
node dist/main
```

5. Configure as variaveis:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
FRONTEND_URL=https://seu-projeto.vercel.app
BACKEND_URL=https://seu-backend.onrender.com
ALLOWED_ORIGINS=https://seu-projeto.vercel.app
APP_DOMAIN=vercel.app
JWT_SECRET=gere-um-segredo-forte
JWT_REFRESH_SECRET=gere-outro-segredo-forte
REDIS_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=delivery_unsigned
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
MP_NOTIFICATION_URL=https://seu-backend.onrender.com/api/v1
RESEND_API_KEY=
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=Delivery SaaS
```

6. O healthcheck publico da API sera:

```text
https://seu-backend.onrender.com/api/v1/health
```

No Railway, o arquivo [backend/nixpacks.toml](C:\Users\aland\Desktop\projects\delivery-full\backend\nixpacks.toml) garante que o deploy rode `prisma db push` antes de subir a API.

## 3. Frontend no Vercel

1. Importe o repositorio no Vercel.
2. Configure o `Root Directory` como `frontend`.
3. Adicione as variaveis:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com/api/v1
NEXT_PUBLIC_APP_DOMAIN=vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
```

4. Faça o deploy.

## 4. Checklist final

- `frontend` carregando no dominio do Vercel
- `backend` respondendo em `/api/v1/health`
- `DATABASE_URL` e `DIRECT_URL` preenchidas com dados do Supabase
- `ALLOWED_ORIGINS` configurado com a URL do Vercel
- `NEXT_PUBLIC_API_URL` apontando para o Render
- `prisma db push` executado no deploy do backend para criar/atualizar as tabelas e colunas do cadastro

## Observacao

O projeto original estava incompleto. Esta versao recomposta e uma base minima publicavel para recuperar o deploy e seguir evoluindo o SaaS com seguranca.
