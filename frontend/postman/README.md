# AppManicure — Manual Operacional da Coleção Postman

## 1. Introdução

Esta documentação descreve como configurar, executar e diagnosticar a coleção Postman do backend **real** do AppManicure.

A coleção representa todas as operações disponíveis no backend atual: autenticação, CRUD de entidades, RPCs transacionais, Edge Functions e testes de segurança.

**Não contém secrets, senhas reais ou tokens reais.**

---

## 2. Pré-requisitos

- [Postman](https://www.postman.com/downloads/) instalado (versão 10+)
- Acesso ao projeto Supabase do AppManicure
- Contas de teste configuradas no Supabase Auth

---

## 3. Importação da Collection

1. Abra o Postman
2. Clique em **Import**
3. Arraste o arquivo `AppManicure-Homologacao.postman_collection.json`
4. Confirme a importação

---

## 4. Configuração das Variáveis

Configure as seguintes variáveis na coleção (botão **...** > **Edit** > aba **Variables**):

| Variável | Onde obter | Exemplo |
|---|---|---|
| `supabase_url` | URL do projeto Supabase | `https://xxxxx.supabase.co` |
| `publishable_key` | API Keys do Supabase (chave pública/anônima) | `eyJhbGciOiJIUzI1NiIs...` |
| `access_token` | Preenchido automaticamente após SignIn | (auto) |
| `refresh_token` | Preenchido automaticamente após SignIn | (auto) |
| `authenticated_user_id` | Preenchido automaticamente após SignIn | (auto) |
| `client_a_email` | E-mail do cliente de teste A | `client_a@test.com` |
| `client_a_password` | Senha do cliente de teste A | `Senha@123` |
| `client_b_email` | E-mail do cliente de teste B | `client_b@test.com` |
| `client_b_password` | Senha do cliente de teste B | `Senha@123` |
| `admin_a_email` | E-mail do admin de teste A | `admin_a@test.com` |
| `admin_a_password` | Senha do admin de teste A | `Senha@123` |
| `admin_b_email` | E-mail do admin de teste B | `admin_b@test.com` |
| `admin_b_password` | Senha do admin de teste B | `Senha@123` |
| `professional_a_id` | Preenchido automaticamente após GetProfessionals | (auto) |
| `professional_b_id` | UUID de outro profissional existente | `uuid` |
| `service_a_id` | Preenchido automaticamente após GetServices | (auto) |
| `service_b_id` | UUID de outro serviço existente | `uuid` |
| `appointment_a_id` | Preenchido automaticamente após PostBookAppointment | (auto) |
| `appointment_b_id` | UUID de outro agendamento existente | `uuid` |
| `professional_service_id` | UUID de vínculo professional_service | `uuid` |
| `availability_id` | UUID de disponibilidade existente | `uuid` |
| `blocked_time_id` | UUID de bloqueio existente | `uuid` |
| `notification_id` | UUID de notificação existente | `uuid` |
| `notification_token_id` | UUID de token de notificação | `uuid` |
| `business_setting_id` | Preenchido automaticamente após GetBusinessSettings | (auto) |

### Obtendo as credenciais do Supabase

1. Acesse o dashboard do Supabase
2. Vá em **Project Settings** > **API**
3. Copie `Project URL` para `supabase_url`
4. Copie `anon public` key para `publishable_key`

### Criando contas de teste

Clientes podem ser criados via `PostSignUp` na collection.

**Admins não podem ser criados via API pública.** O role é fixo em `client` pelo trigger do banco. Para criar um admin:

1. Crie uma conta normalmente via `PostSignUp`
2. No Supabase Dashboard, acesse Authentication > Users
3. No SQL Editor, execute:
   ```sql
   UPDATE users SET role = 'admin' WHERE id = '<user_id>';
   ```
4. Crie um registro em `professionals` vinculado a esse usuário:
   ```sql
   INSERT INTO professionals (user_id, display_name, is_active)
   VALUES ('<user_id>', 'Nome do Profissional', true);
   ```

---

## 5. Autenticação

### Fluxo de autenticação

1. **Cadastro:** `PostSignUp` cria conta em `auth.users` e trigger cria perfil em `public.users`
2. **Login:** `PostSignIn` retorna JWT e refresh token
3. **Token automático:** O script de `PostSignIn` captura `access_token` automaticamente
4. **Uso:** Requests autenticados incluem header `Authorization: Bearer {{access_token}}`
5. **Logout:** `PostSignOut` revoga a sessão

### Tokens

- **access_token:** JWT usado como Bearer token. Expira em 1 hora (padrão Supabase)
- **refresh_token:** Usado para renovar o access_token automaticamente pelo SDK
- **apikey:** Chave pública (publishable_key) usada em todos os requests PostgREST

### Tipos de autenticação nos requests

| Tipo | Header | Descrição |
|---|---|---|
| Pública | `apikey` | Dados públicos (profissionais ativos, serviços ativos, disponibilidade) |
| Autenticada | `apikey` + `Authorization: Bearer` | Dados do usuário autenticado |
| Admin | `apikey` + `Authorization: Bearer` (admin) | Dados administrativos |
| Edge Function | `Authorization: Bearer` | Funções server-side com segredo |

---

## 6. Ordem Recomendada de Execução

### Primeira execução (configuração inicial)

1. `01 — Authentication` > `PostSignUp` — Criar Cliente A
2. `01 — Authentication` > `PostSignUp` — Criar Cliente B
3. `01 — Authentication` > `PostSignIn` — Login como Cliente A
4. `03 — Professionals` > `GetProfessionals` — Listar profissionais (captura `professional_a_id`)
5. `04 — Services` > `GetServices` — Listar serviços (captura `service_a_id`)
6. `06 — Availability` > `GetAvailability` — Listar disponibilidade

### Fluxo de agendamento

7. `09 — Appointments RPCs` > `PostGetAvailableSlots` — Consultar horários
8. `09 — Appointments RPCs` > `PostBookAppointment` — Criar agendamento
9. `08 — Appointments` > `GetAppointmentById` — Ver detalhes
10. `09 — Appointments RPCs` > `PostCancelAppointmentByClient` — Cancelar

### Fluxo administrativo (login como admin)

11. `01 — Authentication` > `PostSignIn` — Login como Admin A
12. `08 — Appointments` > `GetAppointments` — Agenda global
13. `09 — Appointments RPCs` > `PostRescheduleAppointmentByAdmin` — Reagendar
14. `09 — Appointments RPCs` > `PostCancelAppointmentByAdmin` — Cancelar como admin
15. `08 — Appointments` > `DeleteAppointments` — Excluir agendamento

### Testes de segurança

16. `16 — Security Tests` > Executar todos os cenários

---

## 7. Entidades e CRUD

### 7.1 Users

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetUsers | GET | `/rest/v1/users` | Bearer (self/admin) | ✅ |
| GetUserById | GET | `/rest/v1/users?id=eq.{id}` | Bearer (self/admin) | ✅ |
| PatchUsers | PATCH | `/rest/v1/users?id=eq.{id}` | Bearer (self) | ✅ |
| PostUsers | POST | `/rest/v1/users` | — | ❌ Bloqueado por policy |
| DeleteUsers | DELETE | `/rest/v1/users` | — | ❌ Bloqueado por policy |

**Campos atualizáveis:** `name`, `phone`
**Campos protegidos:** `role`, `is_active`, `deleted_at`, `email` (trigger bloqueia)

### 7.2 Professionals

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetProfessionals | GET | `/rest/v1/professionals` | Pública (ativos) | ✅ |
| GetProfessionalById | GET | `/rest/v1/professionals?id=eq.{id}` | Pública (ativo) | ✅ |
| PostProfessionals | POST | `/rest/v1/professionals` | Bearer (admin) | ✅ |
| PatchProfessionals | PATCH | `/rest/v1/professionals?id=eq.{id}` | Bearer (admin) | ✅ |
| DeleteProfessionals | DELETE | `/rest/v1/professionals?id=eq.{id}` | Bearer (admin) | ✅ |

**Campos:** `id`, `user_id`, `display_name`, `is_active`, `created_at`, `updated_at`

### 7.3 Services

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetServices | GET | `/rest/v1/services` | Pública (ativos) | ✅ |
| GetServiceById | GET | `/rest/v1/services?id=eq.{id}` | Pública (ativo) | ✅ |
| PostServices | POST | `/rest/v1/services` | Bearer (admin) | ✅ |
| PatchServices | PATCH | `/rest/v1/services?id=eq.{id}` | Bearer (admin) | ✅ |
| DeleteServices | DELETE | `/rest/v1/services?id=eq.{id}` | Bearer (admin) | ✅ |

**Campos:** `id`, `name`, `description`, `default_duration_minutes`, `is_active`, `created_at`, `updated_at`

### 7.4 ProfessionalServices

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetProfessionalServices | GET | `/rest/v1/professional_services` | Pública (ativos) | ✅ |
| GetProfessionalServiceById | GET | `/rest/v1/professional_services?id=eq.{id}` | Pública (ativo) | ✅ |
| PostProfessionalServices | POST | `/rest/v1/professional_services` | Bearer (admin owner) | ✅ |
| PatchProfessionalServices | PATCH | `/rest/v1/professional_services?id=eq.{id}` | Bearer (admin owner) | ✅ |
| DeleteProfessionalServices | DELETE | `/rest/v1/professional_services?id=eq.{id}` | Bearer (admin owner) | ✅ |

**RLS:** Apenas o admin vinculado ao `professional_id` pode criar/atualizar/deletar.

### 7.5 Availability

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetAvailability | GET | `/rest/v1/availability` | Pública | ✅ |
| GetAvailabilityById | GET | `/rest/v1/availability?id=eq.{id}` | Pública | ✅ |
| PostAvailability | POST | `/rest/v1/availability` | Bearer (admin owner) | ✅ |
| PatchAvailability | PATCH | `/rest/v1/availability?id=eq.{id}` | Bearer (admin owner) | ✅ |
| DeleteAvailability | DELETE | `/rest/v1/availability?id=eq.{id}` | Bearer (admin owner) | ✅ |

### 7.6 BlockedTimes

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetBlockedTimes | GET | `/rest/v1/blocked_times` | Pública | ✅ |
| GetBlockedTimeById | GET | `/rest/v1/blocked_times?id=eq.{id}` | Pública | ✅ |
| PostBlockedTimes | POST | `/rest/v1/blocked_times` | Bearer (admin owner) | ✅ |
| PatchBlockedTimes | PATCH | `/rest/v1/blocked_times?id=eq.{id}` | Bearer (admin owner) | ✅ |
| DeleteBlockedTimes | DELETE | `/rest/v1/blocked_times?id=eq.{id}` | Bearer (admin owner) | ✅ |

### 7.7 Appointments

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetAppointments | GET | `/rest/v1/appointments` | Bearer (own/admin all) | ✅ |
| GetAppointmentById | GET | `/rest/v1/appointments?id=eq.{id}` | Bearer (own/admin all) | ✅ |
| PostAppointments | POST | `/rest/v1/appointments` | Bearer (admin own professional) | ✅ |
| PatchAppointments | PATCH | `/rest/v1/appointments?id=eq.{id}` | Bearer (admin own professional) | ✅ |
| DeleteAppointments | DELETE | `/rest/v1/appointments?id=eq.{id}` | Bearer (admin own professional) | ✅ |

**Nota:** Clients NÃO podem inserir appointments diretamente (policy removida na migration 0014). Devem usar a RPC `book_appointment`.

### 7.8 Notifications

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetNotifications | GET | `/rest/v1/notifications` | Bearer (self) | ✅ |
| GetNotificationById | GET | `/rest/v1/notifications?id=eq.{id}` | Bearer (self) | ✅ |
| PostNotifications | POST | `/rest/v1/notifications` | — | ❌ Bloqueado por policy |
| PatchNotifications | PATCH | `/rest/v1/notifications?id=eq.{id}` | — | ❌ Sem policy |
| DeleteNotifications | DELETE | `/rest/v1/notifications?id=eq.{id}` | — | ❌ Sem policy |

**Nota:** Notifications são criadas internamente por triggers e Edge Functions. O INSERT é bloqueado por policy.

### 7.9 NotificationsTokens

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetNotificationsTokens | GET | `/rest/v1/notifications_tokens` | Bearer (self) | ✅ |
| PostNotificationsTokens | POST | `/rest/v1/notifications_tokens` | Bearer (self) | ✅ |
| PatchNotificationsTokens | PATCH | `/rest/v1/notifications_tokens?id=eq.{id}` | Bearer (self) | ✅ |
| DeleteNotificationsTokens | DELETE | `/rest/v1/notifications_tokens` | — | ❌ Bloqueado por policy |

### 7.10 BusinessSettings

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetBusinessSettings | GET | `/rest/v1/business_settings` | Pública | ✅ |
| PatchBusinessSettings | PATCH | `/rest/v1/business_settings?id=eq.{id}` | Bearer (admin) | ✅ |

### 7.11 AuditLogs

| Operação | Método | Endpoint | Auth | Disponível |
|---|---|---|---|---|
| GetAuditLogs | GET | `/rest/v1/audit_logs` | Bearer (admin) | ✅ |
| PostAuditLogs | POST | `/rest/v1/audit_logs` | — | ❌ Bloqueado por policy |

---

## 8. RPCs (Stored Functions)

### get_available_slots

Calcula horários disponíveis para um profissional em uma data.

```
POST /rest/v1/rpc/get_available_slots
Body: { "p_professional_id": "uuid", "p_service_id": "uuid", "p_date": "YYYY-MM-DD" }
Retorno: Array de { start_at, end_at }
```

### book_appointment

Cria agendamento atomicamente com validação completa.

```
POST /rest/v1/rpc/book_appointment
Body: { "p_professional_id": "uuid", "p_service_id": "uuid", "p_start_at": "ISO8601", "p_client_note": "text" }
Retorno: UUID do agendamento
```

**Validações:**
- Cliente autenticado e ativo
- Profissional ativo
- Serviço disponível para o profissional
- Horário no futuro
- Dentro da disponibilidade (weekday, start_time, end_time)
- Sem bloqueio no intervalo
- Sem conflito com outros agendamentos (constraint GIST)

### cancel_appointment_by_client

Cancela agendamento pelo cliente titular.

```
POST /rest/v1/rpc/cancel_appointment_by_client
Body: { "p_appointment_id": "uuid", "p_reason": "text" }
Retorno: void
```

### cancel_appointment_by_admin

Cancela agendamento pelo admin responsável.

```
POST /rest/v1/rpc/cancel_appointment_by_admin
Body: { "p_appointment_id": "uuid", "p_reason": "text" }
Retorno: void
```

### reschedule_appointment_by_admin

Reagenda pelo admin responsável (apenas status `confirmed`).

```
POST /rest/v1/rpc/reschedule_appointment_by_admin
Body: { "p_appointment_id": "uuid", "p_new_start_at": "ISO8601" }
Retorno: void
```

**Validações:**
- Novo horário no futuro
- Dentro da disponibilidade
- Sem conflito com outros agendamentos

### delete_account

Exclusão lógica da conta do próprio usuário.

```
POST /rest/v1/rpc/delete_account
Body: {}
Retorno: void
```

**Ações:**
- Marca `deleted_at` e `is_active = false` em `users`
- Cancela agendamentos futuros
- Remove tokens de notificação
- Inativa professional record (se admin)
- Registra em `audit_logs`

---

## 9. Edge Functions

### send-push-notification

Envia notificação push via Expo Push API.

```
POST /functions/v1/send-push-notification
Body: { "appointment_id": "uuid", "event": "confirmation" | "cancellation" | "reschedule" }
```

**Autenticação:** Bearer token do participante do appointment (client ou admin).

**Autorization:**
- O caller deve ser o `client_user_id` ou o admin vinculado ao `professional_id` do appointment

**Resposta:**
```json
{ "success": true, "sent": 1, "failed": 0 }
```

### delete-account-external

Exclusão de conta via página externa (conformidade Google Play).

```
POST /functions/v1/delete-account-external
Body: { "email": "user@example.com", "password": "senha" }
```

**Autenticação:** Bearer token do usuário sendo excluído.

**Segurança:**
- Rate limit: 5 tentativas por 15 minutos, bloqueio de 30 minutos
- Verifica que o token pertence ao mesmo usuário das credenciais
- Retorna 403 se o token não corresponder ao usuário

**Resposta de sucesso:**
```json
{ "success": true, "message": "Conta excluída com sucesso" }
```

---

## 10. Segurança

### Regra Central de Autorização

```
PERMITIR escrita SE E SOMENTE SE:
  autenticado = true
  E role = "admin"
  E appointment.professional_id = current_user.professional_id
```

**Ana 1 (admin do Professional P1) vs Ana 2 (admin do Professional P2):**

| Ação | Ana 1 sobre P1 | Ana 1 sobre P2 |
|---|---|---|
| Visualizar | ✅ Permitido | ✅ Permitido |
| Editar | ✅ Permitido | ❌ Negado |
| Cancelar | ✅ Permitido | ❌ Negado |
| Excluir | ✅ Permitido | ❌ Negado |
| Reagendar | ✅ Permitido | ❌ Negado |

### Camadas de Segurança

1. **PostgreSQL RLS (definitiva):** Filtra linhas automaticamente
2. **Triggers de banco:** Bloqueiam campos protegidos (role, is_active, deleted_at, email)
3. **RPCs SECURITY DEFINER:** Validações server-side antes de persistir
4. **Frontend (apenas UX):** Oculta ações não permitidas

### Testes de Segurança na Collection

| Teste | Cenário | Esperado |
|---|---|---|
| `GetClientAProfileAsClientB` | Client B lê perfil próprio (RLS filtra) | 200, apenas dados próprios |
| `PatchClientAProfileAsClientB` | Client B tenta atualizar perfil de A | 401/403 |
| `GetAppointmentAAsClientB` | Client B tenta ver appointment de A | 200, array vazio |
| `PatchProfessionalBAsAdminA` | Admin A modifica Professional B | 401/403 |
| `DeleteProfessionalBAsAdminA` | Admin A deleta Professional B | 401/403 |
| `PostRoleTamperingAsClient` | Client tenta virar admin | 400/401/403 |
| `PostAppointmentTamperingAsClient` | Client tenta inserir appointment direto | 401/403 |
| `PostNotificationWithoutAuthorization` | Sem token na Edge Function | 401 |
| `DeleteAccountAsThirdParty` | Token A com credenciais B | 403 |
| `GetAuditLogsAsClient` | Client tenta ler audit_logs | 200, array vazio |

---

## 11. Troubleshooting

### 400 Bad Request

**Sintoma:** Requisição rejeitada com erro de validação.

**Causas:**
- Payload com campos ausentes ou inválidos
- Tipo incorreto (ex: string onde espera UUID)
- Corpo vazio em POST/PATCH

**Como verificar:** Inspecione o body da resposta para a mensagem de erro.

**Como corrigir:**
- Verifique os campos obrigatórios da entidade
- Use UUIDs válidos para referências
- Garanta Content-Type: application/json

### 401 Unauthorized

**Sintoma:** Token ausente, inválido ou expirado.

**Causas:**
- `Authorization` header ausente ou malformado
- Token expirado (access_token válido por 1 hora)
- `apikey` ausente ou inválido

**Como verificar:** Verifique se `access_token` está preenchido na variável.

**Como corrigir:**
- Execute `PostSignIn` novamente
- Verifique se o header `Authorization: Bearer {{access_token}}` está presente
- Verifique se `publishable_key` está correto

### 403 Forbidden

**Sintoma:** Token válido, mas operação não autorizada.

**Causas:**
- RLS bloqueia a operação (ownership, role)
- Trigger bloqueia alteração de campo protegido
- Usuário não é admin tentando operação administrativa

**Como verificar:** Verifique o role do usuário autenticado e a propriedade do recurso.

**Como corrigir:**
- Use credenciais de admin para operações administrativas
- Verifique se o appointment pertence ao professional do admin
- Não tente modificar campos protegidos (role, is_active, deleted_at)

**Quando é backend:** Sempre. RLS e triggers são aplicados no banco.

### 404 Not Found

**Sintoma:** Recurso não encontrado.

**Causas:**
- UUID inexistente
- Rota/endpoint incorreto
- RPC não encontrada

**Como corrigir:**
- Verifique se o UUID existe no banco
- Confirme o nome da RPC (case-sensitive)
- Verifique se a migration foi aplicada

### 409 Conflict

**Sintoma:** Conflito de dados.

**Causas:**
- Double booking (constraint GIST em appointments)
- Violação de unique constraint
- Conflito de horário na RPC `book_appointment`

**Como verificar:** Verifique se já existe um appointment confirmado no mesmo horário/profissional.

**Como corrigir:**
- Use `get_available_slots` para verificar disponibilidade
- Escolha outro horário
- Cancele o agendamento conflitante primeiro

### 422 Validation Error

**Sintoma:** Dados válidos mas regra de negócio violada.

**Causas:**
- Horário fora da disponibilidade
- Serviço não oferecido pelo profissional
- Agendamento não está mais confirmed

**Como corrigir:**
- Use `get_available_slots` para horários válidos
- Verifique se o service_id está vinculado ao professional

### 429 Rate Limit

**Sintoma:** Muitas tentativas.

**Causas:**
- Excedeu limite da Edge Function `delete-account-external`

**Como corrigir:** Aguarde o período de bloqueio (30 minutos).

### 500 Internal Server Error

**Sintoma:** Erro interno do servidor.

**Causas:**
- Edge Function falhou
- RPC lançou exceção não tratada

**Como verificar:** Verifique os logs do Supabase.

**Quando é backend:** Sempre que o erro não for de validação de input.

### Timeout

**Sintoma:** Requisição expira sem resposta.

**Causas:**
- Latência de rede
- RPC pesada (get_available_slots em datas com muitos dados)

**Como corrigir:**
- Aumente o timeout no Postman (Settings > General > Request Timeout)
- Verifique conexão com a internet

### JWT Expired

**Sintoma:** Token JWT expirou.

**Causas:**
- access_token com mais de 1 hora

**Como corrigir:**
- Execute `PostSignIn` novamente
- O SDK do Supabase renova automaticamente; no Postman, faça login manualmente

### RLS Rejection

**Sintoma:** Operação aparenta sucesso mas dados não são afetados.

**Causas:**
- SELECT retorna array vazio (RLS filtra todas as linhas)
- UPDATE/DELETE retorna 204 mas 0 linhas afetadas

**Como verificar:** Verifique o número de linhas retornadas/afetadas.

**Quando é RLS:** Quando o usuário não tem permissão para os dados solicitados.

### Migration Missing

**Sintoma:** Tabela, coluna ou função não encontrada.

**Causas:**
- Migration não aplicada no ambiente

**Como corrigir:**
- Execute `supabase db push` para aplicar migrations pendentes
- Verifique `supabase migration list`

### Double Booking

**Sintoma:** Erro ao criar appointment em horário já ocupado.

**Causas:**
- Constraint GIST detectou sobreposição

**Como corrigir:**
- Use `get_available_slots` antes de agendar
- O backend previne double booking atomicamente

---

## 12. Limpeza de Dados de Teste

Para limpar dados criados durante testes:

```sql
-- Deletar appointments de teste
DELETE FROM appointments WHERE client_user_id = '<test_user_id>';

-- Deletar serviços de teste
DELETE FROM services WHERE name LIKE '%Teste%';

-- Deletar profissionais de teste
DELETE FROM professionals WHERE display_name LIKE '%Teste%';

-- Deletar usuários de teste (cuidado: afeta auth.users via CASCADE)
DELETE FROM users WHERE email LIKE '%@test.com';
```

**Cuidado:** Nunca execute limpeza em produção.

---

## 13. Limitações Conhecidas do Backend

1. **Admin não pode ser criado via API:** O role `admin` deve ser atribuído manualmente no banco (via Dashboard ou SQL). O signup público sempre cria `client`.

2. **Sem PUT (substituição completa):** O PostgREST usa PATCH para atualizações parciais. Não há PUT implementado.

3. **Notifications CRUD restrito:** Notifications são criadas apenas por triggers e Edge Functions. INSERT/UPDATE/DELETE diretos não são permitidos.

4. **AuditLogs apenas leitura:** AuditLogs podem ser lidos apenas por admins. INSERT é feito apenas por triggers.

5. **RateLimits sem acesso direto:** A tabela `rate_limits` é interna, sem RLS para acesso por usuários.

6. **Notificação push requer token real:** A Edge Function `send-push-notification` requer tokens ExpoPushToken reais registrados.

---

## 14. FAQ

**Por que GetUsers retorna apenas meu perfil?**
RLS filtra para mostrar apenas o perfil do usuário autenticado (`auth.uid() = id`). Admins veem todos.

**Por que não posso criar appointments diretamente?**
A policy `appointments_insert_client` foi removida (migration 0014). Clients devem usar `book_appointment` RPC.

**Por que o cancelamento por PATCH não funciona?**
RLS não permite que clients atualizem appointments diretamente. Use `cancel_appointment_by_client` RPC.

**Como testar se RLS está funcionando?**
Execute requests com tokens de diferentes usuários e verifique que cada um vê apenas seus dados.

**Por que delete-account-external retorna 403?**
O bearer token deve pertencer ao mesmo usuário cujas credenciais foram fornecidas.

---

## 15. Referência Rápida

### URLs base

| Serviço | URL |
|---|---|
| PostgREST (REST) | `{{supabase_url}}/rest/v1/` |
| Auth | `{{supabase_url}}/auth/v1/` |
| RPCs | `{{supabase_url}}/rest/v1/rpc/` |
| Edge Functions | `{{supabase_url}}/functions/v1/` |

### Headers padrão

| Header | Valor | Onde usar |
|---|---|---|
| `apikey` | `{{publishable_key}}` | Todos os requests PostgREST |
| `Authorization` | `Bearer {{access_token}}` | Requests autenticados |
| `Content-Type` | `application/json` | POST/PATCH/PUT |

### HTTP Status Codes

| Código | Significado |
|---|---|
| 200 | OK (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE, PATCH sem retorno) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

**Documentação baseada no backend homologado do AppManicure.**
**Migration 0019 aplicada. Timezone: America/Sao_Paulo.**
**Nenhum secret deve ser inserido nesta collection.**
