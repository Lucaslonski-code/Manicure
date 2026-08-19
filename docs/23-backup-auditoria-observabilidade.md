# 23. Backup, Auditoria e Observabilidade

Status: CONFIRMADO. Especificação baseada nos serviços nativos do Supabase e PostgreSQL.

## 23.1 Backup

| Item | Implementação / Estratégia |
|---|---|
| Banco de dados | Backups diários automatizados gerenciados pela infraestrutura do Supabase (Point-in-Time Recovery / Daily Backups). |
| Migrations e Schemas | 100% versionadas em código dentro de `supabase/migrations/` no controle de versão Git. |
| Restauração | Procedimento de restauração testável via console do Supabase e via CLI local (`supabase db reset` com seeds). |
| Integridade | Validação periódica de snapshots e integridade referencial das FKs e constraints de exclusão. |

## 23.2 Auditoria de Segurança e Negócio

- **Tabela Central:** `public.audit_logs` (ver `08-modelo-banco-dados.md`).
- **Automação:** Triggers no PostgreSQL capturam mutações (`INSERT`, `UPDATE`, `DELETE`) em `appointments`, `users`, `availability` e registram o ator (`auth.uid()`), ação, resultado e metadados contextuais.
- **Tentativas Negadas:** RPCs e Edge Functions registram tentativas de mutação não autorizadas (ex.: Ana 1 tentando alterar agendamento de Ana 2).

## 23.3 Observabilidade e Monitoramento

| Categoria | Ferramenta / Mecanismo | Descrição |
|---|---|---|
| Logs do Banco de Dados | Supabase Postgres Logs | Monitoramento de queries lentas, erros de RLS e chamadas a RPCs. |
| Logs de Edge Functions | Supabase Logflare / Deno Runtime | Execução assíncrona de push notifications e exclusão de contas. |
| Métricas de Infraestrutura | Supabase Dashboard | Uso de CPU, memória, conexões de banco e pool do PostgREST. |
| Monitoramento de Erros Mobile | Sentry / Expo Crash Reporting | Captura de exceções não tratadas e crashes no cliente Android. |
| Conflitos de Agendamento | Monitoramento de erros `409 Conflict` | Identificação de taxas anormais de concorrência ou falhas de disponibilidade. |
