# 26. Matriz de Rastreabilidade

Status: CONFIRMADO. Rastreia a regra central do produto (autorização Ana 1/Ana 2) e os principais requisitos
de ponta a ponta, através de todos os domínios da documentação.

## 26.1 Regra central — rastreabilidade completa

| Camada | Referência |
|---|---|
| Requisito de produto | RF-APPT-006, RF-APPT-007, RF-APPT-008, RF-APPT-009, RF-APPT-005 (`02-requisitos.md`) |
| Regra de segurança | Seção 4.1–4.4 (`04-autorizacao-seguranca.md`) |
| Fluxo administrativo | Seção 6.5.1 (`06-fluxos-admin-agenda-global.md`) |
| Entidade de banco | `appointments.professional_id`, `professionals.user_id` (`08-modelo-banco-dados.md`, `09-entidade-appointment.md`) |
| RLS no PostgreSQL | Políticas RLS em `appointments` (`08-modelo-banco-dados.md`, seção 8.6) |
| API / PostgREST / RPC | `10-api-especificacao.md`, seções 10.5 e 10.8 |
| Backend BaaS | Supabase RLS + RPCs (`11-arquitetura-backend.md`, seções 11.3 e 11.4) |
| Estado de UI (frontend) | Seção 13.3.1 (`13-ux-ui-design-system.md`) |
| Teste negativo | Seção 24.3 (`24-testes-qa.md`) |
| Critério de aceitação | CA-AUTZ-01, CA-AUTZ-02, CA-AUTZ-03 (`25-criterios-aceitacao.md`) |

## 26.2 Matriz geral — requisitos funcionais principais

| Requisito | Fluxo | Tela | Banco | API / SDK | Backend / BaaS | Segurança | Teste | Critério de aceitação |
|---|---|---|---|---|---|---|---|---|
| RF-AUTH-001 (cadastro) | `05` | Cadastro | `auth.users` + `public.users` | `supabase.auth.signUp` | Trigger `on_auth_user_created` | `04` §4.6 | `24` §24.1 | CA-CAD-01/02/03 |
| RF-AUTH-002 (verificação de e-mail) | `05` | Confirmação de e-mail | `auth.users.email_confirmed_at` | `supabase.auth.verifyOtp` | Supabase Auth Mailer | `04` §4.6 | `24` §24.1 | CA-EMAIL-01/02 |
| RF-AUTH-003 (login único) | `05`/`06` | Login | `auth.users` + `public.users` | `supabase.auth.signInWithPassword` | Supabase Auth JWT | `04` | `24` §24.1 | CA-LOGIN-01/02/03/04 |
| RF-AUTH-009 (exclusão de conta) | `05`/`06` | Exclusão de Conta | `public.users.deleted_at` | `deleteUser` via Edge Function | Edge Function + Triggers | `04` | `24` §24.1 | CA-DEL-01/02/03/04 |
| RF-APPT-001 (criar agendamento) | `05` | Resumo/Confirmação | `appointments` | `rpc('book_appointment')` | PostgreSQL RPC Atômica | `04` | `24` §24.1/24.4 | CA-APPT-01/02/03/04 |
| RF-APPT-002 (impedir conflito) | `07` | Horários | `appointments` (constraint gist) | `rpc('book_appointment')` (409) | `btree_gist` constraint | `04` §RNF-CONCUR-001 | `24` §24.4 | CA-APPT-01/04 |
| RF-APPT-005 (agenda global) | `06` | Agenda Global | `appointments` (RLS SELECT) | `from('appointments').select()` | PostgREST + RLS Global | `04` §4.1 | `24` §24.3 | CA-AGENDA-01/02 |
| RF-APPT-006 a 009 (escrita restrita) | `06` | Detalhes do Agendamento | `appointments.professional_id` | PostgREST / RPCs | PostgreSQL RLS Restrito | `04` §4.1–4.4 | `24` §24.3 | CA-AUTZ-01/02 |
| RF-AVAIL-001/002 | `06` | Disponibilidade/Bloqueios | `availability`, `blocked_times` | `from('availability').upsert()` | PostgREST + RLS | `04` (mesma regra de propriedade) | `24` §24.1 | — |
| RF-NOTIF-001 a 004 | `05`/`06` | (transversal) | `notifications` | DB Webhook + Edge Function | Edge Function + Expo Push | `04` §4.6 | `24` §24.1 | CA-NOTIF-01/02/03 |

## 26.3 Observação sobre completude da matriz

Esta matriz cobre os requisitos de maior criticidade (autenticação, autorização, agendamento e a regra
central). Requisitos de menor criticidade (ex.: edição de perfil, filtros de agenda) seguem o mesmo padrão
de rastreabilidade quando detalhados durante a implementação, reutilizando os documentos já referenciados
(`02` a `25`) como fonte, sem necessidade de linha própria nesta matriz para serem consideradas cobertas
documentalmente — os documentos-fonte já contêm a rastreabilidade implícita por meio dos IDs de requisito.
