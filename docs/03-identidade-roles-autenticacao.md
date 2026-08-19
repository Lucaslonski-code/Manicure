# 03. Modelo de Identidade, Roles e Autenticação

Status: CONFIRMADO.
Origem: regra de produto e regra de segurança (prompt mestre).

---

## 3.1 Conceito central

`role ≠ elemento de interface.`

O papel (`role`) é um dado de segurança, resolvido e armazenado no backend/banco, nunca inferido, escolhido
ou enviado pelo cliente (app). O frontend apenas reflete o que o backend informa após autenticação.

## 3.2 Roles existentes

| Role | Criação | Descrição |
|---|---|---|
| `client` | Cadastro público | Usuário que agenda atendimentos. |
| `admin` | Provisionamento manual controlado | Profissional/administradora com acesso à área administrativa e a uma agenda própria. |

O cadastro público (`RF-AUTH-001`) **sempre** resulta em `client`. Não existe endpoint, tela, parâmetro ou
opção de interface que permita que um cadastro público resulte em `admin`.

## 3.3 Provisionamento de admin

Admins são criados por mecanismo controlado, fora do fluxo de cadastro público. Mecanismos possíveis
(a confirmar em decisão de implementação — `PENDENTE DE DECISÃO` quanto ao mecanismo exato):

- Promoção manual de uma conta `client` existente para `admin`, executada por operação administrativa
  restrita (ex.: acesso direto ao banco/console do provedor, ou rotina interna sem exposição pública).
- Criação direta de conta com role `admin` por processo interno da proprietária do negócio/desenvolvedor.

Em qualquer mecanismo escolhido, vale a regra: **nenhum endpoint de API pública aceita `role` como
parâmetro de entrada para definir o papel do próprio usuário.**

## 3.4 Relação conceitual `auth.users → public.users → professionals → appointments`

```
auth.users (1) ──── (1) public.users (1) ──── (0..1) professionals (1) ──── (N) appointments
                                   (client) (1) ────────────────────────── (N) appointments
```

- **`auth.users` (esquema Supabase Auth):** armazena credenciais, e-mail, hash interno de senha, confirmação de e-mail (`email_confirmed_at`), metadados de autenticação e tokens.
- **`public.users` (esquema da aplicação):** armazena dados de domínio (`name`, `phone`, `role`, `is_active`, `deleted_at`). A chave primária `public.users.id` é uma Foreign Key direta para `auth.users.id`.
- Um `user` com role `admin` está associado a **no máximo um** registro em `professionals` (`professionals.user_id = public.users.id`). Essa associação é a base da regra de autorização de escrita (ver `04-autorizacao-seguranca.md`).
- Um `user` com role `client` não possui registro em `professionals`.
- Um `appointment` referencia exatamente um `client` (via `public.users.id`) e exatamente um `professional` (via `professionals.id`), além de um `service`.

## 3.5 Estado da conta

| Atributo | Domínio | Origem / Controle | Descrição |
|---|---|---|---|
| `email_verified` | boolean | `auth.users.email_confirmed_at is not null` | Indica se o e-mail foi confirmado via Supabase Auth. Obrigatório ser `true` para uso funcional. |
| `is_active` | boolean | `public.users.is_active` | Indica se a conta está ativa. Contas inativas são bloqueadas pelo banco/RLS. |
| `role` | `client` \| `admin` | `public.users.role` | Papel de segurança do usuário, protegido contra alteração pelo cliente via RLS. |

## 3.6 Fluxo de autenticação — visão geral

```
Cadastro (supabase.auth.signUp)
  → Criação em auth.users + Trigger inserindo em public.users (role = 'client')
  → Envio de e-mail de confirmação pelo Supabase Auth
  → Confirmação de e-mail (email_verified = true)
  → Login (supabase.auth.signInWithPassword)
  → Resolução de role e professional_id no backend/banco
  → Direcionamento: fluxo client OU fluxo admin
```

### 3.6.1 Cadastro (RF-AUTH-001)

Campos obrigatórios: nome, e-mail, telefone, senha, confirmação de senha.

Fluxo técnico:
- O cliente mobile executa `supabase.auth.signUp({ email, password, options: { data: { name, phone } } })`.
- O Supabase Auth valida a unicidade do e-mail e aplica a política de integridade de senha.
- Um **Database Trigger** no PostgreSQL (`after insert on auth.users`) insere automaticamente o registro correspondente em `public.users` com `role = 'client'`.
- Nenhuma senha ou hash de senha é armazenado na tabela `public.users`.
- O cadastro resulta em `role = client` e `email_verified = false`.

### 3.6.2 Confirmação de e-mail (RF-AUTH-002 / RF-AUTH-008)

- Supabase Auth envia e-mail com link/código de confirmação após cadastro.
- Enquanto `email_confirmed_at` for nulo, a conta autentica mas o app bloqueia o uso funcional, mantendo o usuário na `EmailVerificationStack`.
- Reenvio de confirmação disponível diretamente via SDK (`supabase.auth.resend`).
- Após confirmação, `email_verified = true` e o usuário segue para o fluxo funcional correspondente ao seu papel.

### 3.6.3 Login (RF-AUTH-003)

- Tela única de login (e-mail + senha) para todos os usuários (`supabase.auth.signInWithPassword`), sem seletores de papel na interface.
- Após autenticação, o app consulta `public.users` (e `public.professionals` se admin) para resolver `role` e `professional_id`.
- O frontend utiliza exclusivamente esses dados retornados do banco/backend para decidir a navegação.

### 3.6.4 Recuperação e redefinição de senha (RF-AUTH-005 / RF-AUTH-006)

- Usuário solicita recuperação informando e-mail (`supabase.auth.resetPasswordForEmail`).
- Supabase Auth envia e-mail com token/link seguro de redefinição com tempo de expiração gerenciado pela plataforma.
- Redefinição exige nova senha (`supabase.auth.updateUser({ password })`), invalidando automaticamente sessões anteriores.

### 3.6.5 Logout (RF-AUTH-004)

- Executa `supabase.auth.signOut()`, encerrando a sessão no Supabase e limpando os tokens locais do armazenamento seguro do dispositivo (`expo-secure-store`).

### 3.6.6 Sessão expirada / inválida

- O Supabase Client gerencia o ciclo de vida e renovação automática de tokens via refresh token.
- Caso a sessão expire ou seja revogada, o evento `SIGNED_OUT` é emitido pelo listener `onAuthStateChange`, e o app redireciona imediatamente para a tela de login.

### 3.6.7 Conta desativada

- Se `public.users.is_active = false`, as políticas de RLS e triggers de autenticação rejeitam as operações de negócio com erro padronizado, preservando o princípio de exposição mínima de dados.

## 3.7 Provedor oficial de autenticação: Supabase Auth

O provedor oficial de autenticação é o **Supabase Auth** (GoTrue gerenciado).
A aplicação **não implementa**:
- Algoritmos próprios de hashing de senha (`bcrypt`, `argon2`);
- Geração ou validação manual de tokens JWT;
- Rotação ou armazenamento manual de refresh tokens em tabelas customizadas;
- Servidor próprio de envio de e-mails de recuperação/confirmação (utiliza o serviço integrado do Supabase Auth).

## 3.8 Estados de autenticação (resumo para frontend)

| Estado | Condição | Comportamento esperado |
|---|---|---|
| Não autenticado | Sem sessão válida no Supabase | Acesso apenas a telas públicas (`PublicStack`). |
| Autenticado, e-mail não verificado | Sessão válida, `email_verified = false` | Acesso apenas à tela de confirmação (`EmailVerificationStack`). |
| Autenticado, client | Sessão válida, `email_verified = true`, `role = client` | Acesso ao fluxo de cliente (`ClientStack`). |
| Autenticado, admin | Sessão válida, `email_verified = true`, `role = admin` | Acesso à área administrativa (`AdminStack`). |
| Sessão expirada | Token expirado/revogado | Redirecionamento automático para Login. |
