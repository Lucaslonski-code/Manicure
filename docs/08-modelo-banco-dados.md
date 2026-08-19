# 08. Modelo de Banco de Dados

Status: CONFIRMADO. Modelo conceitual — nenhum SQL, nenhuma migration. Tecnologia de referência: PostgreSQL
(ver `20-decisoes-arquiteturais.md`), detalhes de sintaxe ficam a cargo da implementação.

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

## 8.2 `users`

Finalidade: representar toda pessoa com conta no sistema (cliente ou admin).

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único (chave primária). |
| `name` | Sim | Nome completo. |
| `email` | Sim | E-mail, único no sistema. |
| `phone` | Sim | Telefone de contato. |
| `password_hash` | Sim | Hash da senha (nunca texto puro). |
| `role` | Sim | `client` ou `admin`. |
| `email_verified` | Sim | Booleano; default `false`. |
| `is_active` | Sim | Booleano; default `true`. |
| `created_at` | Sim | Timestamp de criação. |
| `updated_at` | Sim | Timestamp de última atualização. |
| `deleted_at` | Não | Timestamp de exclusão lógica, quando aplicável (ver `15-privacidade-exclusao-conta.md`). |

Constraints: `email` único (case-insensitive recomendado); `role` restrito ao conjunto `{client, admin}`.

Índices: `email` (único); `role` (para consultas administrativas).

Regra de acesso: um `user` só pode ler/editar seu próprio registro, exceto leitura restrita de nome/telefone/
e-mail por admins no contexto de um agendamento do qual é cliente (ver 8.5 e `04-autorizacao-seguranca.md`).

## 8.3 `professionals`

Finalidade: representar o profissional de manicure, associado a exatamente um `user` com `role = admin`.

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `user_id` | Sim | FK para `users.id`; deve referenciar um `user` com `role = admin`. |
| `display_name` | Sim | Nome de exibição do profissional na agenda e para clientes. |
| `is_active` | Sim | Booleano; profissionais inativos não recebem novos agendamentos. |
| `created_at` | Sim | Timestamp de criação. |
| `updated_at` | Sim | Timestamp de atualização. |

Constraints: `user_id` único (um `user` admin corresponde a no máximo um `professional`).

Regra de acesso: leitura pública (para seleção pela cliente, apenas ativos); escrita restrita ao próprio
admin vinculado, ou a provisionamento controlado inicial.

## 8.4 `services`

Finalidade: catálogo de serviços oferecidos pelo negócio.

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `name` | Sim | Nome do serviço. |
| `description` | Não | Descrição opcional. |
| `default_duration_minutes` | Sim | Duração padrão, usada como base para `professional_services`. |
| `is_active` | Sim | Booleano; serviços inativos não podem ser selecionados. |
| `created_at` | Sim | — |
| `updated_at` | Sim | — |

Regra de acesso: leitura pública (ativos); escrita restrita a admins (escopo de propriedade do catálogo —
`PENDENTE DE DECISÃO`, ver `06-fluxos-admin-agenda-global.md`, seção 6.7).

## 8.5 `professional_services`

Finalidade: vínculo entre profissional e serviço, com possível duração/preço específicos.

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `professional_id` | Sim | FK para `professionals.id`. |
| `service_id` | Sim | FK para `services.id`. |
| `duration_minutes` | Sim | Duração efetiva para este profissional (pode divergir do padrão do serviço). |
| `price` | Não | Preço, se o produto decidir exibi-lo — `PENDENTE DE DECISÃO` quanto à exibição de preços no MVP. |
| `is_active` | Sim | Permite desativar a oferta de um serviço por um profissional específico sem desativar o serviço globalmente. |

Constraints: par (`professional_id`, `service_id`) único.

Regra de acesso: leitura pública (ativos); escrita restrita ao admin vinculado ao `professional_id`.

## 8.6 `appointments`

Detalhamento completo em `09-entidade-appointment.md`. Resumo estrutural:

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `client_user_id` | Sim | FK para `users.id` (role `client`). |
| `professional_id` | Sim | FK para `professionals.id` — profissional responsável. |
| `service_id` | Sim | FK para `services.id`. |
| `start_at` | Sim | Início do atendimento (momento absoluto). |
| `end_at` | Sim | Fim do atendimento. |
| `status` | Sim | Ver estados em `09-entidade-appointment.md`. |
| `client_note` | Não | Observação da cliente. |
| `admin_note` | Não | Observação administrativa/profissional. |
| `created_at` / `updated_at` | Sim | Timestamps. |
| `cancelled_at` / `cancelled_by_user_id` | Não | Preenchidos em caso de cancelamento. |

Regra de acesso (regra central do produto):

- Leitura: `client_user_id = current_user.id` (cliente) OU `current_user.role = admin` (qualquer admin, agenda global).
- Escrita: `client_user_id = current_user.id` (cliente, apenas cancelamento do próprio, conforme regra de
  negócio) OU (`current_user.role = admin` E `current_user.professional_id (via professionals) = appointments.professional_id`).

## 8.7 `availability`

Finalidade: jornada de trabalho recorrente do profissional.

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `professional_id` | Sim | FK para `professionals.id`. |
| `weekday` | Sim | Dia da semana (0-6 ou enumeração equivalente). |
| `start_time` | Sim | Horário de início do expediente naquele dia. |
| `end_time` | Sim | Horário de fim do expediente naquele dia. |

Constraints: `end_time > start_time`. Múltiplos intervalos por dia (ex.: manhã e tarde com pausa) são
suportados como múltiplas linhas para o mesmo `weekday`.

Regra de acesso: leitura pública (necessária ao motor de disponibilidade); escrita restrita ao admin
vinculado ao `professional_id`.

## 8.8 `blocked_times`

Finalidade: bloqueios pontuais (folgas, compromissos, feriados registrados manualmente).

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `professional_id` | Sim | FK para `professionals.id`. |
| `start_at` | Sim | Início do bloqueio (momento absoluto). |
| `end_at` | Sim | Fim do bloqueio. |
| `reason` | Não | Motivo opcional, uso interno. |
| `created_at` | Sim | — |

Constraints: `end_at > start_at`.

Regra de acesso: leitura necessária ao motor de disponibilidade (pode ser interna, sem exposição pública
literal do motivo); escrita restrita ao admin vinculado ao `professional_id`.

## 8.9 `notifications`

Finalidade: registro de notificações enviadas/pendentes (detalhamento em `14-notificacoes.md`).

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `user_id` | Sim | Destinatário. |
| `appointment_id` | Não | Referência ao agendamento relacionado, quando aplicável. |
| `type` | Sim | Tipo (confirmação, alteração, cancelamento, lembrete). |
| `channel` | Sim | `push` ou `local` (ver `14-notificacoes.md`). |
| `status` | Sim | Pendente, enviada, falha. |
| `created_at` / `sent_at` | Sim/Não | Timestamps. |

Regra de acesso: leitura restrita ao próprio `user_id`; escrita realizada apenas por processos internos do
backend (não por endpoint público de escrita direta do usuário).

## 8.10 `audit_logs`

Finalidade: registro de ações sensíveis para auditoria (ver `18-android...`; detalhamento consolidado em
`17-google-play.md`/operacional — auditoria propriamente dita é tratada nesta tabela e referenciada em
`11-arquitetura-backend.md`).

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único. |
| `actor_user_id` | Sim | Usuário que executou a ação (ou sistema). |
| `action` | Sim | Tipo de ação (ex.: `appointment.update`, `appointment.cancel`, `appointment.delete`, `login.failed`, `account.delete`). |
| `resource_type` / `resource_id` | Sim | Recurso afetado. |
| `result` | Sim | Sucesso ou negado (com motivo, ex.: `403_professional_mismatch`). |
| `metadata` | Não | Dados adicionais relevantes, sem incluir segredos. |
| `created_at` | Sim | Timestamp. |

Regra de acesso: sem exposição a `client`; acesso restrito a mecanismos internos/operacionais, não a um
endpoint de uso comum por `admin` no MVP — `PENDENTE DE DECISÃO` quanto a uma futura tela de auditoria para
admins.

## 8.11 `business_settings`

Finalidade: configurações únicas do negócio (fuso horário de referência, políticas gerais).

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | Sim | Identificador único (linha única esperada). |
| `timezone` | Sim | Fuso horário de referência do negócio (ver `07-motor-disponibilidade.md`, seção 7.5). |
| `min_cancellation_notice_minutes` | Não | Prazo mínimo para cancelamento pela cliente, se definido — `PENDENTE DE DECISÃO`. |
| `created_at` / `updated_at` | Sim | — |

Regra de acesso: leitura pública (necessária ao app); escrita restrita a mecanismo administrativo de mais
alto nível — `PENDENTE DE DECISÃO` quanto a qual admin (ou papel adicional) pode alterar essas
configurações, dado que o MVP não define um papel "dono do negócio" distinto de `admin` (ver
`01-visao-escopo-atores.md`).

## 8.12 Regras de integridade transversais

- Toda FK possui integridade referencial obrigatória (não é possível criar `appointment` referenciando
  `professional_id`, `service_id` ou `client_user_id` inexistentes).
- Exclusão de `users`, `professionals` ou `services` não deve remover fisicamente `appointments` históricos;
  a estratégia é exclusão lógica/anonimização conforme `15-privacidade-exclusao-conta.md`, preservando a
  integridade do histórico para a outra parte envolvida (ex.: o admin ainda precisa ver o histórico do
  próprio profissional mesmo que a cliente tenha excluído a conta).
- A regra central de autorização (seção 4.1 de `04-autorizacao-seguranca.md`) deve ser suportada
  estruturalmente por este modelo por meio da FK `appointments.professional_id`, que é a base de comparação
  com `professionals.user_id = current_user.id`.

## 8.13 Índices recomendados (conceituais)

| Tabela | Índice | Motivo |
|---|---|---|
| `appointments` | (`professional_id`, `start_at`) | Consulta de disponibilidade e agenda por profissional. |
| `appointments` | (`client_user_id`, `start_at`) | Consulta "meus agendamentos". |
| `appointments` | (`status`) | Filtros da agenda global. |
| `availability` | (`professional_id`, `weekday`) | Consulta de jornada. |
| `blocked_times` | (`professional_id`, `start_at`, `end_at`) | Consulta de bloqueios no intervalo. |
| `professional_services` | (`professional_id`), (`service_id`) | Consulta de catálogo por profissional e vice-versa. |
| `audit_logs` | (`actor_user_id`, `created_at`) | Investigação por usuário/período. |
