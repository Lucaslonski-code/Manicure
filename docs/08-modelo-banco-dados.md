# 08. Modelo de Banco de Dados

Status: CONFIRMADO. Modelo conceitual — nenhum SQL, nenhuma migration. Tecnologia de referência: PostgreSQL
(ver `29-decisoes-arquiteturais.md`), detalhes de sintaxe ficam a cargo da implementação.

---

## 8.1 Visão geral de entidades

```
users ──┬── (0..1) professionals ──< professional_services >── services
        │                    │
        │                    └──< availability
        │                    └──< blocked_times
        │
        ├──< appointments >── professionals
        │        │      >── services
        │        └── (client) users
        │
        ├──< notifications
        ├──< audit_logs
        │
business_settings (configuração única do negócio)
```

## 8.2 `public.users`

Finalidade: representar o perfil de domínio de toda pessoa com conta no sistema (cliente ou admin), vinculado à identidade em `auth.users`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária, FK para `auth.users.id on delete cascade`. |
| `name` | `text` | Sim | Nome completo do usuário. |
| `email` | `text` | Sim | E-mail espelhado de `auth.users`, único no sistema. |
| `phone` | `text` | Sim | Telefone de contato formatado. |
| `role` | `text` / `enum` | Sim | `client` ou `admin`. Default `client`. |
| `is_active` | `boolean` | Sim | Booleano; default `true`. |
| `created_at` | `timestamptz` | Sim | Timestamp de criação. |
| `updated_at` | `timestamptz` | Sim | Timestamp de última atualização. |
| `deleted_at` | `timestamptz` | Não | Timestamp de exclusão lógica (ver `15-privacidade-exclusao-conta.md`). |

*Nota de segurança:* Senhas e hashes de senha são gerenciados exclusivamente pelo Supabase Auth em `auth.users` e **nunca** residem em `public.users`.

Constraints: `email` único; `role` restrito a `{client, admin}`.
Índices: `email` (único); `role`.

### Políticas de RLS para `public.users`:
- `SELECT`: Usuário lê seu próprio registro (`id = auth.uid()`) OU qualquer admin lê dados básicos (`get_auth_role() = 'admin'`).
- `UPDATE`: Usuário edita apenas seus próprios dados pessoais permitidos (`id = auth.uid()`), sendo a coluna `role` imutável pelo cliente.
- `INSERT`: Executado exclusivamente via Database Trigger `on_auth_user_created` (`SECURITY DEFINER`).

## 8.3 `professionals`

Finalidade: representar o profissional de manicure, associado a exatamente um `public.users` com `role = admin`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Identificador único (chave primária). |
| `user_id` | `uuid` | Sim | FK única para `public.users.id` (deve ter `role = admin`). |
| `display_name` | `text` | Sim | Nome de exibição do profissional na agenda e para clientes. |
| `is_active` | `boolean` | Sim | Booleano; profissionais inativos não recebem novos agendamentos. |
| `created_at` | `timestamptz` | Sim | Timestamp de criação. |
| `updated_at` | `timestamptz` | Sim | Timestamp de atualização. |

Constraints: `user_id` único.

### Políticas de RLS para `professionals`:
- `SELECT`: Público para registros ativos (`is_active = true`); todos os registros visíveis para `role = 'admin'`.
- `UPDATE`/`INSERT`: Restrito a administradores do sistema ou provisionamento manual controlado.

## 8.4 `services`

Finalidade: catálogo de serviços oferecidos pelo negócio.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Identificador único (chave primária). |
| `name` | `text` | Sim | Nome do serviço. |
| `description` | `text` | Não | Descrição detalhada opcional. |
| `default_duration_minutes` | `integer` | Sim | Duração padrão em minutos. |
| `is_active` | `boolean` | Sim | Booleano; serviços inativos não podem ser selecionados. |
| `created_at` | `timestamptz` | Sim | Timestamp de criação. |
| `updated_at` | `timestamptz` | Sim | Timestamp de atualização. |

### Políticas de RLS para `services`:
- `SELECT`: Público para ativos (`is_active = true`) e para todos os admins.
- `INSERT`/`UPDATE`: Permitido para `role = 'admin'`.

## 8.5 `professional_services`

Finalidade: vínculo entre profissional e serviço, com duração e preço específicos.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Identificador único (chave primária). |
| `professional_id` | `uuid` | Sim | FK para `professionals.id`. |
| `service_id` | `uuid` | Sim | FK para `services.id`. |
| `duration_minutes` | `integer` | Sim | Duração efetiva para este profissional. |
| `price` | `numeric` | Não | Preço (exibição `PENDENTE DE DECISÃO`). |
| `is_active` | `boolean` | Sim | Booleano de ativação da oferta pelo profissional. |

Constraints: par (`professional_id`, `service_id`) único.

### Políticas de RLS para `professional_services`:
- `SELECT`: Leitura pública para ativos (`is_active = true`).
- `INSERT`/`UPDATE`/`DELETE`: Permitido apenas se `professional_id = get_auth_professional_id()`.

## 8.6 `appointments`

Detalhamento completo em `09-entidade-appointment.md`. Resumo estrutural:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária. |
| `client_user_id` | `uuid` | Sim | FK para `public.users.id`. |
| `professional_id` | `uuid` | Sim | FK para `professionals.id` — profissional responsável. |
| `service_id` | `uuid` | Sim | FK para `services.id`. |
| `start_at` | `timestamptz` | Sim | Início do atendimento (momento absoluto). |
| `end_at` | `timestamptz` | Sim | Fim do atendimento. |
| `status` | `text` / `enum` | Sim | `confirmed`, `cancelled`, `completed`. |
| `client_note` | `text` | Não | Observação da cliente. |
| `admin_note` | `text` | Não | Observação do profissional responsável. |
| `created_at` / `updated_at` | `timestamptz` | Sim | Timestamps. |
| `cancelled_at` | `timestamptz` | Não | Preenchido no cancelamento. |
| `cancelled_by_user_id` | `uuid` | Não | FK para `public.users.id`. |

### Políticas de RLS para `appointments` (Regra Central Normativa):
- `SELECT`: Permitido se `client_user_id = auth.uid()` OU `get_auth_role() = 'admin'` (Agenda Global de Leitura).
- `UPDATE`: Permitido se `(get_auth_role() = 'client' AND client_user_id = auth.uid())` OU `(get_auth_role() = 'admin' AND professional_id = get_auth_professional_id())`.
- `DELETE`: Permitido exclusivamente se `get_auth_role() = 'admin' AND professional_id = get_auth_professional_id()`.
- `INSERT`: Permitido se `(get_auth_role() = 'client' AND client_user_id = auth.uid())` OU `(get_auth_role() = 'admin' AND professional_id = get_auth_professional_id())`.

## 8.7 `availability`

Finalidade: jornada de trabalho recorrente do profissional.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária. |
| `professional_id` | `uuid` | Sim | FK para `professionals.id`. |
| `weekday` | `integer` | Sim | Dia da semana (0-6). |
| `start_time` | `time` | Sim | Início do expediente. |
| `end_time` | `time` | Sim | Fim do expediente. |

### Políticas de RLS para `availability`:
- `SELECT`: Público (para cálculo de slots no motor de disponibilidade).
- `INSERT`/`UPDATE`/`DELETE`: Restrito ao admin vinculado ao `professional_id` (`professional_id = get_auth_professional_id()`).

## 8.8 `blocked_times`

Finalidade: bloqueios pontuais (folgas, compromissos, feriados).

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária. |
| `professional_id` | `uuid` | Sim | FK para `professionals.id`. |
| `start_at` | `timestamptz` | Sim | Início do bloqueio. |
| `end_at` | `timestamptz` | Sim | Fim do bloqueio. |
| `reason` | `text` | Não | Motivo opcional interno. |
| `created_at` | `timestamptz` | Sim | Timestamp. |

### Políticas de RLS para `blocked_times`:
- `SELECT`: Visível para o motor de disponibilidade e para admins.
- `INSERT`/`UPDATE`/`DELETE`: Restrito ao próprio profissional (`professional_id = get_auth_professional_id()`).

## 8.9 `notifications`

Finalidade: registro de notificações de sistema.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária. |
| `user_id` | `uuid` | Sim | Destinatário (`public.users.id`). |
| `appointment_id` | `uuid` | Não | FK para `appointments.id`. |
| `type` | `text` | Sim | `confirmation`, `reschedule`, `cancellation`, `reminder`. |
| `channel` | `text` | Sim | `push` ou `local`. |
| `status` | `text` | Sim | `pending`, `sent`, `failed`. |
| `created_at` / `sent_at` | `timestamptz` | Sim/Não | Timestamps. |

### Políticas de RLS para `notifications`:
- `SELECT`: Usuário lê apenas suas próprias notificações (`user_id = auth.uid()`).
- `INSERT`/`UPDATE`: Executado exclusivamente por triggers de banco ou Edge Functions internas.

## 8.10 `audit_logs`

Finalidade: registro de eventos sensíveis de segurança e mutações de negócio.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária. |
| `actor_user_id` | `uuid` | Sim | Usuário executor (`auth.uid()`) ou sistema. |
| `action` | `text` | Sim | Ex.: `appointment.update`, `appointment.cancel`, `appointment.delete`, `auth.login_failed`. |
| `resource_type` / `resource_id` | `text`/`uuid` | Sim | Recurso afetado. |
| `result` | `text` | Sim | `success` ou `denied`. |
| `metadata` | `jsonb` | Não | Metadados contextuais adicionais. |
| `created_at` | `timestamptz` | Sim | Timestamp. |

### Políticas de RLS para `audit_logs`:
- `SELECT`: Restrito a processos internos / administradores globais autorizados.
- `INSERT`: Inserções realizadas via Database Triggers / `SECURITY DEFINER`.

## 8.11 `business_settings`

Finalidade: configurações globais do negócio.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `uuid` | Sim | Chave primária (linha única). |
| `timezone` | `text` | Sim | Fuso horário de referência (ex.: `America/Sao_Paulo`). |
| `min_cancellation_notice_minutes` | `integer` | Não | Prazo mínimo para cancelamento pela cliente (`PENDENTE DE DECISÃO`). |
| `created_at` / `updated_at` | `timestamptz` | Sim | Timestamps. |

### Políticas de RLS para `business_settings`:
- `SELECT`: Leitura pública / autenticada.
- `UPDATE`: Restrito a administradores.

## 8.12 Regras de integridade transversais

- Toda chave estrangeira possui integridade referencial mandatória.
- Extensão `btree_gist` habilitada com constraint de exclusão:
  `EXCLUDE USING gist (professional_id WITH =, tsrange(start_at, end_at) WITH &&) WHERE (status = 'confirmed')`.
- Exclusão de usuários ou serviços preserva integridade histórica dos agendamentos via anonimização / soft delete.
- A regra de autorização Ana 1 vs. Ana 2 é aplicada de forma nativa e inviolável pelo RLS em `appointments`.

## 8.13 Índices recomendados

| Tabela | Índice | Motivo |
|---|---|---|
| `appointments` | (`professional_id`, `start_at`) | Consulta de agenda e disponibilidade. |
| `appointments` | (`client_user_id`, `start_at`) | Listagem de agendamentos da cliente. |
| `appointments` | (`status`) | Filtros de agenda global. |
| `availability` | (`professional_id`, `weekday`) | Consulta de jornada. |
| `blocked_times` | (`professional_id`, `start_at`, `end_at`) | Consulta de bloqueios temporais. |
| `professional_services` | (`professional_id`), (`service_id`) | Catálogo por profissional. |
| `audit_logs` | (`actor_user_id`, `created_at`) | Rastreabilidade e auditoria. |
