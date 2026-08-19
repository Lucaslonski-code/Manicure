# 10. API e Contratos

Status: CONFIRMADO. Especificação documental — nenhum endpoint é implementado aqui.

Convenções: rotas ilustrativas em estilo REST; formato de payload conceitual (não literal); autenticação via
sessão/token de portador (Bearer), a validar formato exato na documentação oficial do provedor de
autenticação escolhido (`REQUER VALIDAÇÃO OFICIAL`).

Códigos de erro padronizados usados nesta especificação: `400` (entrada inválida), `401` (não autenticado),
`403` (autenticado mas não autorizado), `404` (recurso inexistente ou não visível ao solicitante), `409`
(conflito, ex.: horário indisponível), `422` (entidade não processável / regra de negócio violada).

---

## 10.1 Autenticação (`/auth`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/auth/register` | POST | Não | — | Cadastro público (RF-AUTH-001). Sempre cria `role = client`. |
| `/auth/verify-email` | POST | Não (token no corpo) | — | Confirma e-mail via token/código (RF-AUTH-002). |
| `/auth/resend-verification` | POST | Sim (parcial — conta existente) | — | Reenvia e-mail de confirmação. |
| `/auth/login` | POST | Não | — | Autenticação única (RF-AUTH-003); retorna sessão + `role` + `professional_id` (se admin). |
| `/auth/logout` | POST | Sim | Qualquer | Encerra sessão (RF-AUTH-004). |
| `/auth/forgot-password` | POST | Não | — | Solicita recuperação (RF-AUTH-005). Resposta genérica, independente de o e-mail existir. |
| `/auth/reset-password` | POST | Não (token no corpo) | — | Redefine senha (RF-AUTH-006). |
| `/auth/me` | GET | Sim | Qualquer | Retorna identidade atual: `id`, `name`, `email`, `role`, `email_verified`, `professional_id` (se admin). |

### Exemplo de contrato — `POST /auth/register`

- Request: `name`, `email`, `phone`, `password`, `password_confirmation`.
- Response (201): `user_id`, `email_verified = false`.
- Erros: `400` (campos inválidos/ausentes), `409` (e-mail já cadastrado).
- Regra de negócio: `role` nunca é aceito como campo de entrada; sempre resolvido como `client` no backend.

### Exemplo de contrato — `POST /auth/login`

- Request: `email`, `password`.
- Response (200): token/sessão, `role`, `email_verified`, `professional_id` (quando `role = admin`).
- Erros: `401` (credenciais inválidas ou conta desativada — mensagem genérica única para ambos os casos).

## 10.2 Perfil (`/me`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/me/profile` | GET | Sim | Qualquer | Dados do próprio perfil (RF-PROFILE-001). |
| `/me/profile` | PATCH | Sim | Qualquer | Editar nome/telefone (RF-PROFILE-002); alteração de e-mail reinicia verificação. |
| `/me/account` | DELETE | Sim | Qualquer | Solicita exclusão da própria conta (RF-AUTH-009), ver `15-privacidade-exclusao-conta.md`. |

## 10.3 Catálogo — Cliente (`/professionals`, `/services`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/professionals` | GET | Sim | client/admin | Lista profissionais ativos (RF-CAT-001). |
| `/professionals/{id}/services` | GET | Sim | client/admin | Lista serviços ativos oferecidos pelo profissional (RF-CAT-002). |
| `/professionals/{id}/availability` | GET | Sim | client/admin | Consulta horários disponíveis (RF-AVAIL-003), parâmetros `service_id`, `date`/intervalo de datas. |

Resposta de disponibilidade retorna apenas horários já validados quanto a jornada, bloqueios e ausência de
conflito (ver `07-motor-disponibilidade.md`). Erros: `404` (profissional ou serviço inexistente/inativo),
`422` (combinação profissional/serviço inválida).

## 10.4 Agendamento — Cliente (`/appointments`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/appointments` | POST | Sim | client | Cria agendamento (RF-APPT-001). |
| `/appointments/mine` | GET | Sim | client | Lista agendamentos do próprio cliente (RF-APPT-003), com filtro futuro/histórico. |
| `/appointments/{id}` | GET | Sim | client/admin | Detalhes; cliente só vê os próprios, admin vê qualquer (agenda global). |
| `/appointments/{id}/cancel` | POST | Sim | client | Cancela o próprio agendamento (RF-APPT-004), sujeito a prazo mínimo se definido. |

### Exemplo de contrato — `POST /appointments`

- Request: `professional_id`, `service_id`, `start_at`, `client_note` (opcional).
- Response (201): recurso `appointment` criado com `status = confirmed`.
- Erros: `400` (campos inválidos), `404` (profissional/serviço inexistente), `409` (conflito de horário —
  ver `07-motor-disponibilidade.md`, seção 7.7), `422` (profissional/serviço inativo, combinação inválida,
  horário fora de jornada, `start_at` no passado).
- Regra de negócio: `client_user_id` é sempre resolvido a partir da sessão autenticada, nunca aceito como
  campo de entrada.

## 10.5 Agenda administrativa (`/admin/appointments`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/admin/appointments` | GET | Sim | admin | Agenda global (RF-APPT-005), com filtros `professional_id`, `service_id`, `status`, `date_from`, `date_to`, busca `q` por nome da cliente (RF-AGENDA-002/003). Permitida a **qualquer** admin, sem restrição de propriedade. |
| `/admin/appointments/{id}` | GET | Sim | admin | Detalhes completos, incluindo contato da cliente (RF-APPT-013). Permitido a qualquer admin (leitura global). |
| `/admin/appointments/{id}` | PATCH | Sim | admin | Alterar dados/observação/reagendar (RF-APPT-006/009). **Restrito** ao admin responsável — ver 10.7. |
| `/admin/appointments/{id}/cancel` | POST | Sim | admin | Cancelar (RF-APPT-007). **Restrito** ao admin responsável. |
| `/admin/appointments/{id}` | DELETE | Sim | admin | Excluir (RF-APPT-008). **Restrito** ao admin responsável. |

## 10.6 Disponibilidade e bloqueios — Admin (`/admin/availability`, `/admin/blocked-times`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/admin/availability` | GET | Sim | admin | Consulta a própria jornada (RF-AVAIL-001). |
| `/admin/availability` | PUT | Sim | admin | Define a própria jornada. Restrito ao próprio `professional_id`. |
| `/admin/blocked-times` | GET | Sim | admin | Lista os próprios bloqueios. |
| `/admin/blocked-times` | POST | Sim | admin | Cria bloqueio (RF-AVAIL-002). Restrito ao próprio `professional_id`. |
| `/admin/blocked-times/{id}` | DELETE | Sim | admin | Remove bloqueio. Restrito ao próprio `professional_id`. |

## 10.7 Serviços — Admin (`/admin/services`, `/admin/professional-services`)

| Endpoint | Método | Auth | Role | Finalidade |
|---|---|---|---|---|
| `/admin/services` | POST/PATCH | Sim | admin | Gerencia catálogo (RF-CAT-003) — escopo de propriedade `PENDENTE DE DECISÃO` (ver `08-modelo-banco-dados.md`, seção 8.4). |
| `/admin/professional-services` | POST/PATCH/DELETE | Sim | admin | Vincula serviço ao próprio profissional, com duração (RF-CAT-004). Restrito ao próprio `professional_id`. |

## 10.8 Regra de autorização aplicada a cada operação de escrita sobre agendamento

Para `PATCH /admin/appointments/{id}`, `POST /admin/appointments/{id}/cancel`, `DELETE
/admin/appointments/{id}`:

```
autenticado = verdadeiro
E email_verified = verdadeiro
E current_user.role = "admin"
E current_user.professional_id = appointment.professional_id
   → PERMITIR
CASO CONTRÁRIO
   → 403 Forbidden
```

Isso vale mesmo quando o `appointment_id` existe e é visível na agenda global — a leitura é ampla, a escrita
é restrita. `GET /admin/appointments` e `GET /admin/appointments/{id}` **não** aplicam a checagem de
`professional_id`, apenas checagem de `role = admin`.

## 10.9 Auditoria por endpoint

Toda operação de escrita sobre `appointments` (criação, atualização, cancelamento, exclusão) e toda tentativa
negada por autorização deve gerar um registro em `audit_logs` (ver `08-modelo-banco-dados.md`, seção 8.10),
incluindo o resultado (sucesso/negado) e o motivo em caso de negação.

## 10.10 Resumo de códigos de erro por situação

| Situação | Código |
|---|---|
| Sessão ausente/inválida/expirada | 401 |
| Autenticado mas sem papel/relação exigida (ex.: admin tentando alterar agendamento de outro profissional; client tentando acessar rota `/admin/*`) | 403 |
| Recurso inexistente ou não pertencente ao solicitante em contexto de leitura restrita (ex.: cliente tentando ver agendamento de outra cliente) | 404 (preferencialmente, para não confirmar existência a terceiros) |
| Conflito de horário na criação/alteração | 409 |
| Regra de negócio violada (profissional/serviço inativo, combinação inválida, horário fora de jornada, `start_at` no passado) | 422 |
| Campos ausentes/mal formatados | 400 |

A escolha entre `403` e `404` para "cliente tentando ver agendamento de outra cliente" segue o princípio de
exposição mínima de dados (seção 4.6 de `04-autorizacao-seguranca.md`): preferir `404` nesse caso específico
para não confirmar a existência do recurso a quem não tem relação com ele. Já para admin tentando **escrever**
em agendamento de outro profissional, `403` é preferível, pois a existência do recurso já é conhecida (a
leitura da agenda global é permitida).
