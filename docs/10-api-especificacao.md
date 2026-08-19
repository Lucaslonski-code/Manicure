# 10. API e Contratos (Supabase / PostgREST / RPC)

Status: CONFIRMADO. Especificação técnica oficial baseada na arquitetura BaaS Supabase.

A interface entre o aplicativo mobile e o backend é organizada em três mecanismos complementares:

1. **Supabase SDK / PostgREST:** Para todas as operações de consulta, criação, atualização e exclusão direta protegidas por Row Level Security (RLS).
2. **PostgreSQL RPCs (Stored Functions):** Para operações atômicas, transacionais ou com validações complexas de concorrência (ex.: agendamento e cálculo de disponibilidade).
3. **Supabase Edge Functions:** Exclusivamente para operações privilegiadas ou integrações externas que exigem segredos de servidor (`service_role key`), como envio de push notifications e exclusão externa de conta.

---

## 10.1 Autenticação (`Supabase Auth SDK`)

| Operação | Método SDK | Auth Requerida | Descrição |
|---|---|---|---|
| Cadastro | `supabase.auth.signUp(...)` | Não | Cria conta em `auth.users`; trigger cria `public.users` (`role = 'client'`). |
| Confirmação de e-mail | `supabase.auth.verifyOtp(...)` / Link | Não | Valida posse do e-mail via código/link transacional. |
| Reenvio de confirmação | `supabase.auth.resend(...)` | Não | Reenvia e-mail de ativação. |
| Login | `supabase.auth.signInWithPassword(...)` | Não | Retorna sessão JWT e usuário autenticado. |
| Logout | `supabase.auth.signOut()` | Sim | Revoga sessão ativa e limpa armazenamento local. |
| Recuperação de senha | `supabase.auth.resetPasswordForEmail(...)` | Não | Envia e-mail de recuperação seguro. |
| Redefinição de senha | `supabase.auth.updateUser({ password })` | Sim (token de recuperação) | Define nova senha e invalida sessões anteriores. |
| Obter sessão ativa | `supabase.auth.getSession()` / `getUser()` | Sim | Recupera identidade autenticada atual. |

## 10.2 Perfil do Usuário (`PostgREST / public.users`)

| Operação | Chamada PostgREST | RLS / Permissão | Finalidade |
|---|---|---|---|
| Consultar perfil | `supabase.from('users').select('*').eq('id', auth.uid()).single()` | `id = auth.uid()` | Dados do perfil do usuário autenticado. |
| Atualizar perfil | `supabase.from('users').update({ name, phone }).eq('id', auth.uid())` | `id = auth.uid()` | Atualiza nome e telefone (role imutável pelo cliente). |
| Exclusão de conta (app) | `supabase.functions.invoke('delete-account')` / RPC | `auth.uid()` | Executa anonimização e exclusão da conta no Supabase Auth. |

## 10.3 Catálogo e Disponibilidade (`PostgREST` e `RPC`)

| Operação | Chamada | Tipo | Finalidade |
|---|---|---|---|
| Listar profissionais | `supabase.from('professionals').select('*').eq('is_active', true)` | PostgREST (RLS) | Lista profissionais ativos para seleção. |
| Listar serviços do profissional | `supabase.from('professional_services').select('*, service:services(*)').eq('professional_id', id).eq('is_active', true)` | PostgREST (RLS) | Catálogo de serviços com duração e preço. |
| Consultar horários disponíveis | `supabase.rpc('get_available_slots', { p_professional_id, p_service_id, p_date })` | PostgreSQL RPC | Retorna horários livres calculados no PostgreSQL. |

## 10.4 Agendamento — Cliente (`PostgREST` e `RPC`)

| Operação | Chamada | Tipo | Finalidade |
|---|---|---|---|
| Criar agendamento | `supabase.rpc('book_appointment', { p_professional_id, p_service_id, p_start_at, p_client_note })` | PostgreSQL RPC | Criação atômica com validação concorrente (retorna `201` ou `409 Conflict`). |
| Listar meus agendamentos | `supabase.from('appointments').select('*, professional:professionals(*), service:services(*)').eq('client_user_id', auth.uid()).order('start_at')` | PostgREST (RLS) | Lista agendamentos da própria cliente (futuros/histórico). |
| Detalhes do agendamento | `supabase.from('appointments').select('*, professional:professionals(*), service:services(*)').eq('id', id).single()` | PostgREST (RLS) | Consulta detalhe do agendamento próprio. |
| Cancelar agendamento | `supabase.rpc('cancel_appointment_by_client', { p_appointment_id, p_reason })` | PostgreSQL RPC / PostgREST | Cancela agendamento próprio respeitando prazo mínimo. |

## 10.5 Agenda Administrativa (`PostgREST` e `RPC`)

| Operação | Chamada | Tipo | Regra RLS / Autorização |
|---|---|---|---|
| Visualizar Agenda Global | `supabase.from('appointments').select('*, client:users(name, phone, email), professional:professionals(*), service:services(*)').order('start_at')` | PostgREST (RLS) | **Permitido a qualquer admin** (`get_auth_role() = 'admin'`). |
| Detalhes do agendamento (admin) | `supabase.from('appointments').select('*, client:users(name, phone, email), professional:professionals(*), service:services(*)').eq('id', id).single()` | PostgREST (RLS) | **Permitido a qualquer admin** (Leitura Global ampla). |
| Alterar / Reagendar | `supabase.rpc('reschedule_appointment_by_admin', { p_appointment_id, p_new_start_at })` OU PostgREST `update` | RPC / PostgREST (RLS) | **Restrito ao admin responsável:** `professional_id = get_auth_professional_id()`. |
| Cancelar agendamento (admin) | `supabase.from('appointments').update({ status: 'cancelled', cancelled_at: now(), cancelled_by_user_id: auth.uid() }).eq('id', id)` | PostgREST (RLS) | **Restrito ao admin responsável:** `professional_id = get_auth_professional_id()`. |
| Excluir agendamento (admin) | `supabase.from('appointments').delete().eq('id', id)` | PostgREST (RLS) | **Restrito ao admin responsável:** `professional_id = get_auth_professional_id()`. |

## 10.6 Gestão Administrativa de Disponibilidade e Serviços

| Operação | Chamada | Tipo | Autorização |
|---|---|---|---|
| Consultar própria jornada | `supabase.from('availability').select('*').eq('professional_id', get_auth_professional_id())` | PostgREST (RLS) | Apenas o próprio profissional. |
| Atualizar jornada | `supabase.from('availability').upsert(...)` | PostgREST (RLS) | Restrito ao próprio `professional_id`. |
| Gerenciar bloqueios | `supabase.from('blocked_times').insert / delete` | PostgREST (RLS) | Restrito ao próprio `professional_id`. |
| Gerenciar serviços | `supabase.from('professional_services').upsert / delete` | PostgREST (RLS) | Restrito ao próprio `professional_id`. |

## 10.7 Supabase Edge Functions (Lógica Server-side Privilegiada)

| Edge Function | Invocação | Finalidade |
|---|---|---|
| `send-push-notification` | Database Webhook em `appointments` | Envia notificação push via Expo Push API com payload estruturado. |
| `delete-account-external` | Chamada HTTP pública autenticada | Processa solicitações de exclusão de conta vindas da página web externa (requisito Google Play). |

## 10.8 Regra de Autorização Central Aplicada à API

Para qualquer operação de mutação (`UPDATE`, `DELETE`, RPC de reagendamento) sobre a tabela `appointments`:

```
PERMITIR SE E SOMENTE SE:
  auth.uid() is not null
  E get_auth_role() = 'admin'
  E appointment.professional_id = get_auth_professional_id()
CASO CONTRÁRIO:
  Operação rejeitada pelo RLS (0 linhas afetadas) ou RPC com erro de autorização.
```

Essa regra garante que **Ana 1 não pode alterar/cancelar/excluir agendamentos de Ana 2**, mesmo que consiga visualizá-los na consulta de agenda global.

## 10.9 Tratamento e Padronização de Erros

| Situação | Código HTTP / PostgREST | Comportamento no App |
|---|---|---|
| Token ausente / expirado | `401 Unauthorized` | Redirecionamento imediato para a tela de Login. |
| Acesso negado por RLS (escrita em agendamento alheio) | `403 Forbidden` / 0 rows affected | Exibição de mensagem de permissão negada. |
| Recurso inexistente | `404 Not Found` | Mensagem "registro não encontrado". |
| Conflito de horário no agendamento (`double booking`) | `409 Conflict` (via RPC / constraint) | Alerta "horário não está mais disponível" e atualização de grade. |
| Violação de regra de negócio / validação | `422 Unprocessable Entity` | Feedback no formulário com o motivo do erro. |
