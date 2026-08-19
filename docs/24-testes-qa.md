# 24. Testes e QA

Status: CONFIRMADO.

## 24.1 Escopo de testes

| Área | Cobertura mínima esperada |
|---|---|
| Autenticação | Cadastro válido/inválido, login válido/inválido, logout, recuperação e redefinição de senha. |
| Verificação de e-mail | Bloqueio de acesso funcional sem verificação; reenvio; confirmação bem-sucedida. |
| Sessão | Expiração, invalidação após logout, comportamento em múltiplos dispositivos. |
| Roles | Resolução correta de `client`/`admin` após login; ausência de qualquer via de auto-promoção a admin. |
| Autorização | Regra central Ana 1/Ana 2 (ver 24.3); acesso de client a rotas admin. |
| Agendamento | Criação válida, campos obrigatórios, observação opcional. |
| Conflito / double booking | Duas tentativas concorrentes para o mesmo horário/profissional (ver 24.4). |
| Disponibilidade | Horários oferecidos respeitam jornada, bloqueios, duração do serviço. |
| Cancelamento | Cliente cancelando o próprio; admin responsável cancelando; admin não responsável impedido. |
| Exclusão de conta | Fluxo completo de cliente e de admin (ver `15-privacidade-exclusao-conta.md`). |
| Notificações | Recebimento de confirmação/alteração/cancelamento/lembrete; comportamento com permissão negada. |
| UI | Estados de carregamento, erro, vazio, sucesso em todas as telas principais. |
| Acessibilidade | Contraste, área de toque, compatibilidade com leitor de tela (validação básica, sem ferramenta específica definida — `PENDENTE DE DECISÃO`). |
| Segurança | Casos negativos de autorização (ver 24.3), tentativa de manipulação direta de requisição. |
| Regressão | Reexecução dos casos críticos a cada nova versão antes do release candidate. |
| Dispositivos Android | Cobertura mínima definida em `18-android-build-assinatura-testes.md`, seção 18.7. |

## 24.2 Quem pode testar durante o desenvolvimento

- Desenvolvedor(a) — testes técnicos e funcionais contínuos.
- Proprietária do negócio — validação de UX e de regras de negócio reais.
- Profissionais (futuras admins) — validação do fluxo administrativo, incluindo a regra de responsabilidade
  por profissional.
- Clientes reais do negócio — validação do fluxo de agendamento, inclusive como parte do teste fechado do
  Google Play (ver `21-teste-interno-fechado-conformidade.md`, seção 21.2.2), sempre de forma voluntária.
- Dispositivos físicos e emuladores, conforme `18-android-build-assinatura-testes.md`.

## 24.3 Casos negativos obrigatórios — autorização

| Caso | Resultado esperado |
|---|---|
| Ana 1 tenta alterar agendamento de Ana 2 (via API direta) | `403 Forbidden`; nenhuma alteração persistida; registro em `audit_logs` como tentativa negada. |
| Ana 1 tenta cancelar agendamento de Ana 2 | `403 Forbidden`; agendamento permanece `confirmed`. |
| Ana 1 tenta excluir agendamento de Ana 2 | `403 Forbidden`; agendamento permanece no banco. |
| Ana 2 tenta alterar/cancelar/excluir agendamento de Ana 1 | Mesmo resultado da linha acima, com papéis invertidos. |
| Client tenta acessar rota/tela administrativa | Bloqueio de navegação no frontend; `403` do backend se a rota de API for chamada diretamente. |
| Usuário não verificado tenta usar funcionalidades além da confirmação de e-mail | Redirecionamento/bloqueio consistente; nenhuma ação de negócio executada. |
| Cliente tenta visualizar agendamento de outra cliente via manipulação de identificador (deep link/URL) | `404` (ou `403`, conforme critério de exposição mínima de dados definido em `10-api-especificacao.md`, seção 10.10); nenhum dado de terceiros exposto. |

## 24.4 Caso negativo obrigatório — concorrência

| Caso | Resultado esperado |
|---|---|
| Duas clientes tentam reservar o mesmo horário para o mesmo profissional quase simultaneamente | Exatamente uma requisição é aceita (`201`); a outra recebe `409 Conflict`; nenhum estado de sobreposição é persistido no banco (ver `07-motor-disponibilidade.md`, seção 7.6). |

## 24.5 Formato de definição de casos de teste

Cada caso de teste, ao ser detalhado na implementação, deve registrar: identificador, pré-condição, ação,
resultado esperado, e (quando aplicável) o requisito funcional/não funcional relacionado (ver
`26-matriz-rastreabilidade-criterios-aceitacao.md`). Este documento define o escopo e os casos essenciais;
o detalhamento exaustivo caso a caso é produzido durante a implementação, não nesta especificação.

## 24.6 Critério de saída de QA para um release candidate

Um release candidate (ver `22-deploy-operacao-ambientes.md`) só avança para teste interno/fechado quando:

- Todos os casos negativos das seções 24.3 e 24.4 passam.
- Os fluxos principais de cliente e admin (docs 05 e 06) funcionam de ponta a ponta sem erro não tratado.
- Nenhuma regressão é observada nos casos críticos previamente validados.
- Os critérios de aceitação formais (ver `25-criterios-aceitacao.md`) aplicáveis à versão em questão estão
  satisfeitos.
