# Documentação — Aplicativo de Agendamento para Manicure

Status geral: documentação completa e auditada em 18 de agosto de 2026 (ver `31-auditoria-consistencia.md`).

Este é o índice oficial da documentação do produto. Ela foi construída para servir como fonte única de
verdade — produto, requisitos, arquitetura, banco, API, frontend, segurança, UX, Android, Google Play,
testes, deploy e operação — permitindo que uma equipe de desenvolvimento (humana ou uma IA implementadora)
construa o sistema sem depender da conversa original que originou esta documentação.

Nenhum documento contém código de produção, SQL executável, comandos ou credenciais reais. Decisões ainda
não tomadas estão marcadas como `PENDENTE DE DECISÃO`; itens que dependem de confirmação em fontes externas
no momento da implementação estão marcados como `REQUER VALIDAÇÃO OFICIAL`.

## Ordem recomendada de leitura

### 1. Produto e requisitos
- [01. Visão de Produto, Escopo e Atores](01-visao-escopo-atores.md)
- [02. Requisitos Funcionais e Não Funcionais](02-requisitos.md)

### 2. Identidade, segurança e fluxos (núcleo do produto)
- [03. Identidade, Roles e Autenticação](03-identidade-roles-autenticacao.md)
- [04. Autorização (RBAC) e Segurança](04-autorizacao-seguranca.md) — **documento normativo da regra central**
- [05. Fluxos Completos da Cliente](05-fluxos-cliente.md)
- [06. Fluxos da Administradora e Agenda Global](06-fluxos-admin-agenda-global.md)
- [07. Motor de Disponibilidade e Prevenção de Double Booking](07-motor-disponibilidade.md)

### 3. Dados e API
- [08. Modelo de Banco de Dados](08-modelo-banco-dados.md)
- [09. Entidade `appointments` — Detalhamento](09-entidade-appointment.md)
- [10. API e Contratos](10-api-especificacao.md)

### 4. Arquitetura de software
- [11. Arquitetura Backend](11-arquitetura-backend.md)
- [12. Arquitetura Frontend Mobile e Navegação](12-arquitetura-frontend-mobile.md)
- [13. UX/UI e Design System](13-ux-ui-design-system.md)
- [14. Notificações](14-notificacoes.md)

### 5. Privacidade
- [15. Privacidade, Dados Pessoais e Exclusão de Conta](15-privacidade-exclusao-conta.md)

### 6. Android
- [16. Android — Arquitetura e Compatibilidade](16-android.md)
- [17. Android — Permissões](17-android-permissoes.md)
- [18. Android — Build (EAS), Assinatura e Testes em Dispositivos](18-android-build-assinatura-testes.md)
- [19. Distribuição Privada para a Cliente Antes da Publicação](19-distribuicao-privada-cliente.md)

### 7. Google Play
- [20. Google Play — Processo Completo de Publicação](20-google-play.md)
- [21. Teste Interno, Teste Fechado e Matriz de Conformidade](21-teste-interno-fechado-conformidade.md)

### 8. Deploy e operação
- [22. Deploy, Ambientes e Secrets](22-deploy-operacao-ambientes.md)
- [23. Backup, Auditoria e Observabilidade](23-backup-auditoria-observabilidade.md)

### 9. Qualidade
- [24. Testes e QA](24-testes-qa.md)
- [25. Critérios de Aceitação](25-criterios-aceitacao.md)
- [26. Matriz de Rastreabilidade](26-matriz-rastreabilidade-criterios-aceitacao.md)

### 10. Continuidade
- [27. Operação e Manutenção](27-operacao-manutencao.md)
- [28. Arquitetura Futura para iOS](28-arquitetura-futura-ios.md)

### 11. Governança da documentação
- [29. Decisões Arquiteturais](29-decisoes-arquiteturais.md)
- [30. Riscos, Decisões Pendentes e Glossário](30-riscos-pendencias-glossario.md)
- [31. Auditoria de Consistência](31-auditoria-consistencia.md)

### Especificação consolidada
- [PRODUCT-SPECIFICATION.md](PRODUCT-SPECIFICATION.md) — visão central que amarra todos os documentos acima, sem substituí-los.

## Decisões principais já confirmadas (resumo)

- Android é a primeira plataforma; arquitetura preparada para expansão futura a iOS (`28`).
- Stack de frontend: React Native + Expo + TypeScript (`12`, `29` ADR-02).
- Banco de dados: PostgreSQL (`08`, `29` ADR-03).
- Login único para `client` e `admin`, com role resolvido no backend (`03`, `12`).
- Cadastro público sempre cria `client`; `admin` é provisionado manualmente (`03`, `29` ADR-05).
- Verificação de e-mail obrigatória antes do uso funcional (`03`).
- **Regra central:** agenda global de leitura para todos os admins; escrita restrita ao admin vinculado ao
  profissional responsável pelo agendamento, aplicada em backend/banco, nunca apenas no frontend (`04`, `29`
  ADR-06/ADR-07).
- Prevenção formal de double booking garantida no backend/banco (`07`).
- Publicação via Google Play, com `targetSdkVersion` = API 36 (Android 16), AAB e Play App Signing (`16`,
  `18`, `20`, `29` ADR-08/ADR-09).
- Teste fechado com requisito de 12 testadores optados por 14 dias para contas pessoais novas, podendo
  incluir clientes reais do negócio de forma voluntária (`21`).
- Exclusão de conta disponível dentro do app e por página externa, conforme exigência do Google Play (`15`).
- Contas críticas (Google Play, backend, domínio) devem pertencer à proprietária do negócio, não apenas ao
  desenvolvedor (`22`, `29` ADR-10).

## Dependências entre documentos

O documento `04-autorizacao-seguranca.md` é referenciado por praticamente todos os demais documentos
técnicos (`08` a `26`), pois define a regra de negócio e segurança central do produto. Qualquer alteração
futura nessa regra exige revisão coordenada de todos os documentos listados na matriz de rastreabilidade
(`26`).

## Fontes oficiais utilizadas nesta documentação

| Fonte | Utilizada em | Data de consulta |
|---|---|---|
| Android Developers — Meet Google Play's target API level requirement (`developer.android.com/google/play/requirements/target-sdk`) | `16`, `20`, `29` | 18/08/2026 |
| Play Console Help — Target API level requirements for Google Play apps (`support.google.com/googleplay/android-developer/answer/11926878`) | `16`, `20` | 18/08/2026 |
| Play Console Help — App testing requirements for new personal developer accounts (`support.google.com/googleplay/android-developer/answer/14151465`) | `20`, `21` | 18/08/2026 |

Toda política de plataforma referenciada nesta documentação deve ser revalidada contra a fonte oficial
vigente antes de cada submissão real, conforme registrado em `27-operacao-manutencao.md`, seção 27.3.

## Pendências e riscos

Consolidados em `30-riscos-pendencias-glossario.md`. Nenhuma decisão pendente foi resolvida por suposição em
qualquer documento desta pasta.
