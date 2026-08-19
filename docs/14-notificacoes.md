# 14. Notificações

Status: CONFIRMADO quanto ao escopo do MVP.

## 14.1 Tipos de notificação (MVP)

| ID | Evento | Destinatário | Canal |
|---|---|---|---|
| RF-NOTIF-001 | Confirmação de agendamento criado | Cliente e admin responsável | Push |
| RF-NOTIF-002 | Alteração de agendamento (reagendamento, mudança de dados) | Cliente e admin responsável (quem não originou a ação) | Push |
| RF-NOTIF-003 | Cancelamento de agendamento | Cliente e admin responsável (quem não originou a ação) | Push |
| RF-NOTIF-004 | Lembrete de agendamento próximo | Cliente | Push, com possível reforço local |

Notificações consideradas **essenciais** ao MVP: as quatro acima. Candidatas **futuras**, fora do MVP:
notificação de aniversário, campanhas promocionais, notificação de avaliação pós-atendimento — todas
`PENDENTE DE DECISÃO` e fora do escopo atual (ver `01-visao-escopo-atores.md`).

## 14.2 Push vs. local

| Tipo | Definição | Uso no produto |
|---|---|---|
| Push notification | Enviada pelo backend através de um serviço de push (ex.: serviço de mensagens do Expo/Android), entregue mesmo com app fechado. | Confirmação, alteração, cancelamento, lembrete (gerado no momento certo pelo backend). |
| Notificação local | Agendada diretamente pelo dispositivo, sem depender do backend no momento da exibição. | Uso possível como reforço complementar do lembrete (ex.: agendado no momento da criação do agendamento, cancelado se o agendamento for alterado/cancelado) — `PENDENTE DE DECISÃO` se será usada além do push. |

## 14.3 Permissões (Android)

- O app solicita permissão de notificações ao usuário no momento apropriado (não necessariamente no
  primeiro uso — ver `16-android.md`, seção de permissões, para diretriz de solicitação contextual).
- Caso a permissão seja negada, o app continua funcional; apenas notificações push não são recebidas — o
  usuário ainda pode consultar agendamentos manualmente no app.

## 14.4 Token de dispositivo

- Após login bem-sucedido e concessão de permissão, o app registra o token de push do dispositivo junto ao
  backend, associado ao `user_id`.
- Um usuário pode ter múltiplos dispositivos registrados (ex.: troca de aparelho) — tokens antigos inválidos
  devem ser tratados (ver 14.6).
- No logout, o token do dispositivo é desassociado do usuário (ou marcado inativo) para evitar envio de
  notificações após a sessão ser encerrada localmente.

## 14.5 Falhas e reenvio

- Falha no envio de uma notificação push não deve impedir nem reverter a operação de negócio que a originou
  (criação/alteração/cancelamento de agendamento) — ver `11-arquitetura-backend.md`, seção 11.7.
- Registro de falha é mantido em `notifications.status = failed` (ver `08-modelo-banco-dados.md`, seção 8.9)
  para eventual diagnóstico; reenvio automático não é requisito obrigatório do MVP —
  `PENDENTE DE DECISÃO`.

## 14.6 Duplicação e token inválido

- O backend deve evitar disparo duplicado do mesmo evento de notificação (ex.: idempotência baseada no
  evento de origem, como `appointment_id` + `type`).
- Token de dispositivo que retorna erro de "inválido/não registrado" do serviço de push deve ser marcado
  como inativo no backend, evitando novas tentativas de envio para aquele token.

## 14.7 Abertura de tela a partir da notificação

- Toque em notificação de confirmação/alteração/cancelamento/lembrete abre diretamente o detalhe do
  agendamento relacionado (deep link interno — ver `12-arquitetura-frontend-mobile.md`, seção 12.8),
  respeitando a mesma proteção de rota da navegação normal (sessão válida exigida; se a sessão não for mais
  válida, redireciona para Login e, após novo login, pode direcionar ao destino original — comportamento
  exato de retomada é `PENDENTE DE DECISÃO`).

## 14.8 Escopo por destinatário

- Notificações para o **admin responsável** referem-se apenas a agendamentos do próprio `professional_id` —
  um admin não recebe notificações de eventos de agendamentos de outro profissional, preservando
  consistência com a regra central de autorização (ainda que a leitura da agenda global permaneça possível
  dentro do app).
