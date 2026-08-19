# 09. Entidade `appointments` — Detalhamento

Status: CONFIRMADO. Complementa `08-modelo-banco-dados.md`, seção 8.6.

## 9.1 Propósito

Representar cada atendimento agendado entre uma cliente e um profissional, para um serviço específico, em
um intervalo de tempo determinado, com um status rastreável ao longo do ciclo de vida do agendamento.

## 9.2 Campos completos

| Campo | Tipo conceitual | Obrigatório | Descrição |
|---|---|---|---|
| `id` | identificador | Sim | Chave primária. |
| `client_user_id` | referência a `users` | Sim | Cliente titular do agendamento. |
| `professional_id` | referência a `professionals` | Sim | Profissional responsável — base da regra de autorização de escrita. |
| `service_id` | referência a `services` | Sim | Serviço agendado. |
| `start_at` | momento absoluto | Sim | Início do atendimento. |
| `end_at` | momento absoluto | Sim | Fim do atendimento (derivado de `start_at` + duração do serviço no momento da criação). |
| `status` | enumeração | Sim | Ver seção 9.3. |
| `client_note` | texto opcional | Não | Observação livre da cliente ao criar o agendamento. |
| `admin_note` | texto opcional | Não | Observação do profissional/admin, editável apenas pelo admin responsável. |
| `created_at` | timestamp | Sim | Momento de criação do registro. |
| `updated_at` | timestamp | Sim | Última modificação. |
| `cancelled_at` | timestamp opcional | Não | Preenchido quando `status = cancelled`. |
| `cancelled_by_user_id` | referência a `users`, opcional | Não | Quem cancelou (cliente ou admin responsável). |
| `cancellation_reason` | texto opcional | Não | Motivo do cancelamento, quando informado. |

Campos de contato (telefone/e-mail) exibidos na visão administrativa **não são duplicados** na tabela
`appointments`; são obtidos por relação com `users` (via `client_user_id`), evitando dados desatualizados
duplicados. A visão administrativa (API/consulta) faz o join necessário — ver `10-api-especificacao.md`.

## 9.3 Estados do agendamento

| Estado | Descrição | Definido por |
|---|---|---|
| `confirmed` | Estado padrão ao criar um agendamento válido — não há etapa de aprovação manual no MVP. | Criação bem-sucedida |
| `cancelled` | Cancelado pela cliente ou pelo admin responsável. | Ação de cancelamento |
| `completed` | Atendimento realizado; horário já passou e não foi cancelado. | Transição automática ou marcação manual — ver 9.4 |

Não é criado um estado `pending`/"pendente de aprovação" porque o MVP não prevê fluxo de aprovação manual de
agendamento pelo profissional — a criação já valida disponibilidade e confirma imediatamente (ver
`07-motor-disponibilidade.md`). Caso o produto decida introduzir aprovação manual no futuro, isso é
`PENDENTE DE DECISÃO` e exigiria um novo estado, não presumido neste MVP.

## 9.4 Transição para `completed`

Duas estratégias conceituais possíveis:

1. **Automática:** um processo agendado (job) marca como `completed` todo `appointment` com `status =
   confirmed` e `end_at` no passado.
2. **Derivada em tempo de leitura:** o status "concluído" é calculado na consulta (sem persistir mudança de
   estado), mantendo `confirmed` como único estado persistido ativo além de `cancelled`.

A escolha entre as duas é `PENDENTE DE DECISÃO` de implementação; ambas satisfazem o requisito funcional de
exibir corretamente o histórico (RF-APPT-010). Este documento não presume qual será usada.

## 9.5 Transições permitidas

```
[novo]
   │ criação válida
   ▼
confirmed ──────────► cancelled   (por cliente titular OU admin responsável)
   │
   │ end_at no passado, sem cancelamento
   ▼
completed
```

Transições **não permitidas**:

- `cancelled → confirmed` (reabertura de cancelamento não é suportada no MVP; a cliente/admin deve criar um
  novo agendamento).
- `completed → confirmed` ou `completed → cancelled` (atendimento já ocorrido é imutável quanto ao status).

## 9.6 Reagendamento (RF-APPT-009)

Reagendar, para fins deste modelo, é conceitualmente uma **alteração dos campos `start_at`/`end_at`** de um
agendamento existente em estado `confirmed`, sujeita às mesmas validações de disponibilidade da criação
(seção 7.2–7.4 de `07-motor-disponibilidade.md`) e à mesma regra de autorização de escrita (apenas o admin
responsável pelo `professional_id` do agendamento). Não é modelado como exclusão + criação de novo registro,
para preservar o histórico de auditoria do mesmo `id`.

## 9.7 Regras de integridade

- `end_at > start_at` sempre.
- `start_at` não pode estar no passado no momento da criação (validado no backend, não apenas no frontend).
- Não pode haver dois registros com `status = confirmed` para o mesmo `professional_id` com intervalos
  sobrepostos (ver `07-motor-disponibilidade.md`, seção 7.6 — constraint de exclusão ou transação
  equivalente).
- `client_note` e `admin_note` possuem limite de tamanho razoável, a definir — `PENDENTE DE DECISÃO` quanto
  ao valor exato (evitar tamanho ilimitado por razões de abuso/armazenamento).

## 9.8 Regra central de autorização aplicada à entidade

| Operação | Quem pode executar |
|---|---|
| Criar | Cliente autenticado, para si mesma. |
| Ler (própria) | Cliente titular (`client_user_id = current_user.id`). |
| Ler (agenda global) | Qualquer admin autenticado e verificado. |
| Atualizar (dados, reagendar) | Admin cujo `professional_id` (via tabela `professionals`) corresponde a `appointments.professional_id`. |
| Cancelar | Cliente titular (respeitando prazo mínimo, se definido) OU admin responsável. |
| Excluir | Admin responsável (exclusão física — distinta de cancelamento lógico; ver nota abaixo). |

**Nota sobre exclusão física:** "excluir" (RF-APPT-008) é tratado como operação distinta de "cancelar"
(RF-APPT-007). Cancelar preserva o registro com `status = cancelled` (histórico visível). Excluir remove o
registro do conjunto normalmente consultado — decisão de implementação sobre exclusão física vs. exclusão
lógica adicional (soft delete) é `PENDENTE DE DECISÃO`, mas em qualquer caso a operação de exclusão está
sujeita à mesma regra de autorização do admin responsável, nunca disponível a outro admin nem à cliente.
