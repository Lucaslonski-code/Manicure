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

## 14.2 Push Notifications via Supabase Edge Function e Expo Push API

| Componente | Função |
|---|---|
| Database Trigger / Webhook | Detecta inserções ou atualizações na tabela `appointments` e aciona a Edge Function. |
| Supabase Edge Function (`send-push-notification`) | Monta o payload, recupera o token do destinatário e envia a requisição HTTP para a Expo Push API. |
| Expo Push Service / FCM | Entrega a notificação push no dispositivo Android da cliente ou profissional. |
| `expo-notifications` (Frontend) | Registra o token no app, solicita permissões e trata o toque na notificação (deep link). |

## 14.3 Permissões (Android)

- O app solicita permissão de notificações ao usuário no momento apropriado (Android 13+ `POST_NOTIFICATIONS` — ver `16-android.md`).
- Caso a permissão seja negada, o app continua 100% funcional; o usuário ainda pode consultar seus agendamentos normalmente na interface.

## 14.4 Registro e Gestão do Token de Push

- Após autenticação, o app obtém o `ExpoPushToken` e o persiste na tabela `notifications_tokens` vinculada ao `user_id`.
- Ao realizar logout (`supabase.auth.signOut()`), o token associado ao dispositivo é desativado ou removido para evitar disparos indevidos.

## 14.5 Falhas, Resiliência e Desacoplamento

- O envio da notificação via Edge Function é completamente assíncrono. Falhas na Expo Push API não revertem nem afetam a transação de agendamento no PostgreSQL.
- O status de disparo é registrado em `notifications` (`status = 'sent' | 'failed'`).

## 14.6 Idempotência e Limpeza de Tokens Inválidos

- A Edge Function utiliza uma chave de idempotência (`appointment_id` + `status` + `timestamp`) para evitar disparos repetidos.
- Tokens que retornam `DeviceNotRegistered` da Expo Push API são automaticamente removidos da base.

## 14.7 Abertura de tela a partir da notificação

- O toque na notificação aciona o handler de `expo-notifications`, abrindo o detalhe do agendamento correspondente (respeitando a proteção de rotas e a validação de sessão).

## 14.8 Escopo por destinatário

- O admin responsável recebe notificações **exclusivamente** dos agendamentos de seu próprio `professional_id`. Ana 1 não recebe notificações de eventos de Ana 2.
