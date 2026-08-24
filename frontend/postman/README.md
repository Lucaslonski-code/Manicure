# AppManicure — Coleção Postman de Homologação

Coleção manual para validação de fluxos reais do AppManicure contra o Supabase.

**Esta coleção não contém secrets, senhas reais ou tokens reais.**  
Preencha as variáveis da coleção com dados de homologação antes de executar.

---

## Variáveis

| Variável | Finalidade |
|---|---|
| `base_url` | URL base da API (se aplicável). |
| `supabase_url` | URL do projeto Supabase (ex.: `https://<project>.supabase.co`). |
| `supabase_anon_key` | Chave anônima do Supabase (`anon key`). |
| `access_token` | Token JWT obtido após login (`Sign In`). |
| `refresh_token` | Refresh token obtido após login. |
| `client_a_email` / `client_a_password` | Credenciais de um cliente de teste. |
| `client_b_email` / `client_b_password` | Credenciais de outro cliente (para testes de isolamento). |
| `admin_a_email` / `admin_a_password` | Credenciais de um admin de teste. |
| `admin_b_email` / `admin_b_password` | Credenciais de outro admin (para testes de autorização cruzada). |
| `professional_a_id` | ID de um profissional criado para teste. |
| `professional_b_id` | ID de outro profissional (para testes de escrita cruzada). |
| `service_id` | ID de um serviço criado para teste. |
| `appointment_id` | ID de um agendamento criado durante os testes. |

---

## Ordem recomendada

1. **01 — Health / Configuration**: confira disponibilidade do projeto.
2. **02 — Authentication**: crie contas, faça login, obtenha tokens.
3. **08 — Data Setup**: crie serviços e dados necessários para os fluxos.
4. **03 — Client**: fluxos do cliente (agendamento, cancelamento).
5. **04 — Admin**: fluxos administrativos (agenda global, profissionais).
6. **05 — Notifications**: teste de envio de push (requer token de dispositivo real).
7. **06 — Account Deletion**: exclusão de conta via Edge Function.
8. **07 — Security Tests**: valide cenários de violação de autorização.

---

## Critério de aprovação

| Categoria | Esperado |
|---|---|
| Testes de sucesso | `200`, `201` ou `204` |
| Testes de segurança (acesso não autorizado) | `401` ou `403` |
| Account deletion | `200` ou `403` (dependendo da regra de ownership) |

Não considerar apenas `200 OK` como sucesso em testes de segurança. O objetivo é confirmar que operações não autorizadas são rejeitadas.

---

## Observações

- Esta coleção espelha as regras documentadas em `docs/04-autorizacao-seguranca.md`.
- Testes de admin cruzam perfis (`admin_a` sobre `professional_b`) para validar RLS.
- Não insira `service_role` ou secrets reais nas variáveis.
- Tokens capturados em `Sign In` são reutilizados automaticamente nos requests subsequentes via scripts de teste.

