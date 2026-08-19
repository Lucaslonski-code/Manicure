# 17. Android — Permissões

Status: CONFIRMADO. Princípio orientador: não solicitar permissões que o aplicativo não necessita
(minimização — alinhado a `RNF-SEC-001`/princípio de menor privilégio e a políticas de dados da Google Play,
ver `20-google-play.md`).

## 17.1 Análise individual de permissões

| Permissão | Necessária no MVP? | Motivo | Alternativa sem a permissão | Impacto em privacidade | Impacto na Play Store | Comportamento se negada |
|---|---|---|---|---|---|---|
| Internet | Sim | Comunicação com o backend (autenticação, agendamento, agenda). | Não há alternativa — funcionalidade central depende de rede. | Nenhum (permissão normal, não sensível). | Nenhum requisito adicional de declaração — permissão padrão de apps conectados. | N/A — permissão concedida automaticamente em tempo de instalação (não é permissão em tempo de execução). |
| Notificações (POST_NOTIFICATIONS, em versões recentes do Android) | Sim | Envio de confirmação, alteração, cancelamento e lembrete de agendamento (RF-NOTIF). | Usuário consultaria manualmente o app sem alertas proativos. | Baixo — apenas habilita entrega de notificações já descritas na finalidade do app. | Deve ser declarada no formulário de Data Safety como uso de dados para notificações, se aplicável — ver `20-google-play.md`. | App funcional; apenas notificações push não são exibidas. Usuário ainda acessa agendamentos manualmente. |
| Telefone (ligar diretamente, `CALL_PHONE`) | Não, por padrão | Ação de "ligar para a cliente" pode ser implementada via intent padrão do sistema (abrir discador), que não exige a permissão `CALL_PHONE` (essa permissão só é necessária para iniciar a chamada diretamente sem interação do usuário). | Abrir o discador do sistema com o número pré-preenchido (não exige permissão especial). | Nenhum impacto adicional ao evitar a permissão. | Evita justificativa adicional de uso sensível no Data Safety. | N/A — não solicitada. |
| Contatos | Não | O app não precisa ler/gravar a agenda de contatos do dispositivo; dados de contato da cliente vêm do próprio cadastro no backend. | Nenhuma necessidade de alternativa — funcionalidade não faz parte do MVP. | Alto, se solicitada sem necessidade — evitada. | Alto risco de rejeição/questionamento na revisão se solicitada sem justificativa clara. | N/A — não solicitada. |
| Calendário do dispositivo | Não no MVP | Sincronizar agendamentos com o calendário nativo do dispositivo é uma funcionalidade não incluída no MVP (`PENDENTE DE DECISÃO` como funcionalidade futura). | Usuário pode adicionar manualmente ao próprio calendário, se desejar, sem integração automática. | Médio, se solicitada — evitada por ora. | Exigiria justificativa específica de Data Safety se implementada futuramente. | N/A — não solicitada no MVP. |
| Localização | Não | O aplicativo não oferece funcionalidades dependentes de localização (ex.: encontrar salão mais próximo) no MVP — negócio único, não uma busca geográfica de múltiplos salões. | Nenhuma necessidade. | Alto, se solicitada sem necessidade — evitada. | Alto risco de rejeição/questionamento — Google exige justificativa robusta para localização. | N/A — não solicitada. |
| Câmera | Não no MVP | Não há requisito funcional de captura de foto (ex.: foto do resultado do serviço) definido no MVP. | Nenhuma necessidade no escopo atual. | Médio, se solicitada — evitada. | Exigiria justificativa se implementada futuramente (`PENDENTE DE DECISÃO`, fora do MVP). | N/A — não solicitada no MVP. |
| Microfone | Não | Nenhuma funcionalidade de áudio no produto. | N/A | N/A | N/A | N/A — não solicitada. |
| Fotos/Arquivos (armazenamento de mídia) | Não no MVP | Sem upload de imagens no MVP (ver `11-arquitetura-backend.md`, seção 11.8). | N/A | N/A | N/A | N/A — não solicitada no MVP. |
| Bluetooth | Não | Nenhuma funcionalidade de conectividade de curto alcance. | N/A | N/A | N/A | N/A — não solicitada. |

## 17.2 Conjunto final de permissões do MVP

```
INTERNET
POST_NOTIFICATIONS (ou equivalente vigente na versão-alvo do Android, a validar na documentação
  oficial do Android no momento da implementação)
```

Nenhuma outra permissão sensível é solicitada no MVP. Qualquer necessidade futura de nova permissão deve ser
justificada e documentada neste arquivo antes da implementação, com atualização correspondente da seção de
Data Safety em `20-google-play.md`.

## 17.3 Momento de solicitação (permissão de notificações)

Alinhado à boa prática de solicitação contextual: a permissão de notificações deve ser solicitada em um
momento relevante ao usuário (ex.: após o primeiro agendamento bem-sucedido, ou em tela explicativa antes da
solicitação do sistema), não imediatamente na abertura do app sem contexto — decisão de UX específica é
`PENDENTE DE DECISÃO`, mas o princípio de solicitação contextual é confirmado.
