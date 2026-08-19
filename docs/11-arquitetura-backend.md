# 11. Arquitetura Backend (Supabase BaaS / RLS / Edge Functions)

Status: CONFIRMADO. Documento de arquitetura oficial baseado na plataforma Supabase.

## 11.1 Responsabilidades por camada

| Camada | Tecnologia | Responsabilidade | Confiável para segurança? |
|---|---|---|---|
| Frontend Mobile | React Native + Expo (TypeScript) | Coleta de entradas, validação de formato (feedback imediato), navegação e ocultação condicional de UI. | Não — apenas UX. |
| Autenticação & API BaaS | Supabase Auth + PostgREST | Emissão/validação de tokens JWT, exposição de queries/mutações protegidas. | Sim — camada de acesso gerenciada. |
| Banco de Dados & Autorização | PostgreSQL + Row Level Security (RLS) | **Defesa primária e definitiva:** integridade referencial, constraints de exclusão temporal, controle de acesso a nível de linha. | Sim — autoridade máxima de segurança. |
| Mutações Críticas / Concorrência | PostgreSQL RPCs (Stored Functions) | Operações atômicas transacionais (cálculo de slots livres e reserva sem sobreposição). | Sim — camada transacional. |
| Processos Privilegiados Assíncronos | Supabase Edge Functions (Deno) | Disparo de push notifications (Expo Push API) e exclusão externa de conta. | Sim — execução server-side com `service_role`. |

## 11.2 Estrutura do projeto Supabase / Backend

Em vez de um servidor Node.js/Express tradicional intermediário para CRUD básico, a estrutura é organizada em artefatos gerenciados no repositório:

```
supabase/
  config.toml              # Configurações do projeto Supabase
  migrations/              # Migrations declarativas SQL (tabelas, constraints, RLS, triggers, RPCs)
    0001_initial_schema.sql
    0002_rls_policies.sql
    0003_functions_rpcs.sql
    0004_triggers_audit.sql
  functions/               # Supabase Edge Functions (Deno / TypeScript)
    send-push-notification/ # Disparo assíncrono de notificações via Expo Push API
    delete-account-external/# Endpoint seguro para solicitação externa de exclusão (Google Play)
  seed.sql                 # Dados iniciais para ambiente local/desenvolvimento
```

## 11.3 Fluxo de uma escrita administrativa com RLS (exemplo: alterar/cancelar agendamento)

```
1. Cliente envia mutação via Supabase SDK (PostgREST) com JWT Bearer Token.
2. Supabase Auth valida a assinatura e expiração do JWT e injeta auth.uid().
3. PostgreSQL avalia as políticas de Row Level Security (RLS) da tabela appointments:
   - SELECT get_auth_role() -> verifica se é 'admin'.
   - SELECT get_auth_professional_id() -> obtém o ID do profissional vinculado a auth.uid().
   - Compara appointments.professional_id = get_auth_professional_id().
4. Se divergente (ex.: Ana 1 tentando cancelar agendamento de Ana 2):
   - A operação é rejeitada pelo banco (0 linhas afetadas ou erro de permissão).
   - Trigger registra tentativa negada em public.audit_logs.
5. Se autorizado (Ana 1 operando sobre agendamento de Ana 1):
   - A mutação é persistida com sucesso no PostgreSQL.
   - Trigger registra evento em public.audit_logs.
   - Database Webhook aciona a Edge Function send-push-notification para notificar a cliente.
```

## 11.4 Row Level Security (RLS) — papel central e mandatório

O RLS é a **linha de defesa definitiva** do sistema:
- Habilitado obrigatoriamente em 100% das tabelas do esquema `public`.
- Funções auxiliares `SECURITY DEFINER` (`get_auth_role()`, `get_auth_professional_id()`) encapsulam a leitura de perfis sem vazar privilégios ao cliente.
- Garante imunidade absoluta contra vulnerabilidades IDOR/BOLA e adulteração de payloads HTTP.

## 11.5 Funções de banco (PostgreSQL RPCs)

Utilizadas para encapsular lógicas transacionais que exigem atomicidade:
- `book_appointment`: verifica jornada, bloqueios e conflitos temporais de horários, realizando a inserção atômica e prevenindo *double booking*.
- `get_available_slots`: calcula em tempo de execução os intervalos livres para um profissional/serviço/data.

## 11.6 Validação — divisão de responsabilidade

| Tipo de validação | Frontend | PostgreSQL / Supabase |
|---|---|---|
| Formato de e-mail/telefone | Sim (feedback imediato) | Sim (CHECK constraints / validações de schema) |
| Senha e confirmação | Sim | Sim (política de senha do Supabase Auth) |
| Unicidade de e-mail | Não (inseguro no cliente) | Sim (constraint única em `auth.users`) |
| Disponibilidade de horários | Leitura visual | Sim (validação atômica na RPC e constraint temporal) |
| Autorização (regra Ana 1 vs. Ana 2) | Ocultação de botões (apenas UX) | **Sim (Políticas de RLS no PostgreSQL)** |

## 11.7 Notificações Push e Edge Functions

O envio de notificações push é desacoplado das transações de banco:
- Triggers ou Database Webhooks no PostgreSQL disparam a Edge Function `send-push-notification` de forma assíncrona.
- Uma falha na entrega de push notification não reverte a operação de agendamento no banco de dados.

## 11.8 Storage (Avaliação no MVP)

O MVP **não necessita** de Supabase Storage, pois não há funcionalidade de upload de fotos ou documentos (ver `01-visao-escopo-atores.md`). Caso surja necessidade futura (ex.: fotos de serviços concluídos), buckets serão configurados mantendo RLS isolado.

## 11.9 Observabilidade e Auditoria

- **Auditoria de Negócio:** Tabela `public.audit_logs` alimentada por triggers no PostgreSQL.
- **Logs Técnicos de Servidor:** Supabase Logflare / Postgres Logs para monitoramento de latência, erros de RPCs e execução de Edge Functions.
