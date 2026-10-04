# BarbaPro - guia de instalação

## 1. Banco de dados (Supabase)
No SQL Editor, rode **nesta ordem, uma única vez cada**:
1. `supabase_schema.sql`
2. `supabase_fase5.sql`
3. `supabase_fase6.sql`
4. `supabase_fase7.sql`  (novo: anti-spam, permissões e fuso por barbearia)

## 2. Variáveis de ambiente (Vercel e `.env.local`)
Copie `.env.example` e preencha. A chave `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o navegador nem para o GitHub.

## 3. Conta do Super Admin
O login do painel admin é uma conta do Supabase (não existe senha dentro do código).
Crie com o script, passando e-mail e senha:

    ADMIN_EMAIL=seu@email.com ADMIN_SENHA='sua-senha' npm run criar-admin

Rode de novo com outra senha para trocá-la. Depois entre em `/login`.

## 4. Avisos no celular (push)
1. Gere as chaves: `npx web-push generate-vapid-keys` e preencha `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_EMAIL`.
2. Invente uma senha longa para `PUSH_WEBHOOK_SECRET`.
3. No Supabase: **Database > Webhooks > Create a new hook**
   - Tabela: `notifications`, evento: **Insert**
   - Tipo: HTTP Request, método **POST**
   - URL: `https://SEU-SITE.vercel.app/api/push/enviar`
   - Header: `x-webhook-secret` com o mesmo valor de `PUSH_WEBHOOK_SECRET`
4. No painel do dono, clique em "Ativar avisos neste aparelho".

## 5. Rodar
    npm install
    npm run dev

## Limites anti-spam (fase 7)
- 3 horários futuros por telefone na mesma barbearia
- 5 tentativas por telefone por hora
- 40 agendamentos por barbearia a cada 10 minutos
- 3 pedidos de orçamento por e-mail por hora
Isso barra abuso comum. Se virar alvo de ataque dirigido, adicione um captcha (Cloudflare Turnstile) no formulário.
