# 30. Riscos, Decisões Pendentes e Glossário

Status: CONFIRMADO quanto à estrutura; itens individuais conforme detalhado abaixo.

## 30.1 Riscos

| ID | Categoria | Descrição | Mitigação documentada |
|---|---|---|---|
| RISCO-01 | Segurança | Falha de implementação da regra central de autorização (escrita restrita ao profissional responsável) permitindo acesso horizontal indevido. | Defesa em múltiplas camadas (`04`), testes negativos obrigatórios (`24` §24.3), auditoria (`23`). |
| RISCO-02 | Produto/Técnico | Double booking por falha na garantia de concorrência do motor de disponibilidade. | Constraint de banco/transação atômica (`07` §7.6), teste de concorrência obrigatório (`24` §24.4). |
| RISCO-03 | Operação | Perda de dados por ausência ou falha de backup. | Backup automatizado e verificação periódica (`23` §23.1). |
| RISCO-04 | Segurança | Vazamento/perda de credenciais (secrets, upload key). | Gestão de secrets fora do Git, titularidade adequada de contas (`22` §22.6-22.8, ADR-10). |
| RISCO-05 | Publicação | Rejeição na revisão do Google Play por não conformidade (Data Safety incorreto, permissão não justificada, política de privacidade ausente). | Matriz de conformidade (`21` §21.3), mapeamento de dados (`20` §20.7). |
| RISCO-06 | Privacidade | Tratamento inadequado de dados pessoais além da finalidade declarada. | Mapeamento explícito de finalidade por dado (`15` §15.1-15.2). |
| RISCO-07 | Produto | Notificações não entregues de forma confiável (falha de push, token inválido). | Tratamento de falha e token inválido documentado (`14` §14.5-14.6), sem bloqueio da operação principal (`11` §11.7). |
| RISCO-08 | Compatibilidade | Mudança de requisito de `targetSdkVersion` do Google Play entre a elaboração deste documento e a publicação real. | Revalidação obrigatória a cada ciclo (`27` §27.3). |
| RISCO-09 | Operação | Dependência exclusiva da conta pessoal do desenvolvedor para continuidade do produto (Google Play, backend, domínio). | Titularidade das contas atribuída à proprietária do negócio (`22` §22.6, ADR-10). |
| RISCO-10 | Manutenção | Desatualização de dependências (Expo/React Native/backend) gerando vulnerabilidades ou incompatibilidade. | Revisão periódica de dependências (`27` §27.4). |
| RISCO-11 | Publicação | Não cumprimento do requisito de teste fechado (12 testadores/14 dias) por dificuldade de recrutar testadores voluntários. | Uso combinado de rede pessoal do desenvolvedor e clientes reais do negócio (`21` §21.2.2, `19`). |
| RISCO-12 | Produto | Ausência de papel "dono do negócio" distinto de `admin` pode gerar ambiguidade sobre quem decide configurações globais (`business_settings`). | Registrado como decisão pendente (ver 30.2); não resolvido silenciosamente. |

## 30.2 Decisões pendentes (consolidado de todos os documentos)

Esta lista consolida, para referência rápida, todos os itens marcados como `PENDENTE DE DECISÃO` ao longo da
documentação. Cada item remete ao documento de origem, que contém o contexto completo.

| Item | Documento de origem |
|---|---|
| Existência de papel "superadmin"/dono não-profissional | `01` §1.7 |
| Suporte a multi-idioma | `01` §1.7 |
| Nome comercial definitivo do aplicativo | `01` §1.7 |
| Mecanismo exato de provisionamento de admin | `03` §3.3 |
| Provedor concreto de autenticação | `03` §3.7 |
| Validade exata do token de recuperação de senha | `03` §3.6.4 |
| Prazo mínimo de cancelamento pela cliente | `08` §8.11, `05` |
| Estratégia de transição para status `completed` (automática vs. derivada) | `09` §9.4 |
| Tamanho máximo de `client_note`/`admin_note` | `09` §9.7 |
| Estratégia de exclusão física vs. lógica adicional em `appointments` | `09` §9.8 |
| Estratégia de garantia de concorrência (constraint de exclusão vs. transação) | `07` §7.6 |
| Estratégia de armazenamento de fuso horário (UTC interno vs. horário local fixo) | `07` §7.5 |
| Escopo de propriedade do catálogo de serviços (por profissional vs. compartilhado) | `08` §8.4, `06` §6.7 |
| Exibição de preço de serviços no app | `08` §8.5, `13` §13.2 |
| Decisão sobre "desabilitar" vs. "omitir" horários indisponíveis na UI | `05`, `13` §13.2 |
| Mecanismo exato de confirmação de exclusão de conta (dupla confirmação/digitação) | `05` |
| Tratamento de agendamentos futuros ao excluir conta de admin | `15` §15.7.2 |
| Prazo de retenção de `audit_logs` após exclusão de conta | `15` §15.5, `15` §15.9 |
| Existência/hospedagem da página externa de exclusão de conta | `15` §15.8 |
| Valores definitivos de identidade visual (cores, tipografia, espaçamento, radius, sombras, ícones) | `13` §13.6 |
| Uso de notificação local como reforço complementar ao push | `14` §14.2 |
| Reenvio automático de notificação falha | `14` §14.5 |
| Comportamento exato de retomada de navegação após login via deep link de notificação | `14` §14.7 |
| `minSdkVersion` definitivo | `16` §16.2 |
| `applicationId`/package name definitivo | `16` §16.3, `20` §20.3 |
| Convenção de `versionName` | `16` §16.3, `22` §22.3 |
| Travar orientação retrato vs. permitir rotação | `16` §16.4 |
| Suporte a tablets Android | `16` §16.5 |
| Persistência de rascunho de formulário em encerramento do app | `16` §16.7 |
| Política de descontinuação de versões antigas do app | `16` §16.11, `22`, `27` |
| Momento exato de solicitação de permissão de notificações | `17` §17.3 |
| Mecanismo de criação da conta de demonstração para revisão do Google | `20` §20.10 |
| Existência de ambiente de homologação/staging | `22` §22.7 |
| Processo formal de resposta a incidentes | `22` §22.5 |
| Frequência de backup e cadência de teste de restauração | `23` §23.1 |
| Valores de RTO/RPO | `23` §23.1 |
| Ferramentas concretas de observabilidade/métricas/alertas | `23` §23.3 |
| Mecanismo concreto de canal de suporte pós-publicação | `27` §27.1 |
| Cadência de revisão de dependências | `27` §27.4 |
| Processo formal de transferência de titularidade de contas | `29` ADR-10 |
| Quem decide alterações em `business_settings` (dado ausência de papel "dono") | `08` §8.11 |

Nenhuma dessas decisões foi resolvida silenciosamente nesta documentação. Cada uma exige definição explícita
de produto e/ou técnica antes ou durante a implementação correspondente.

## 30.3 Requisitos que exigem validação oficial antes da implementação

| Item | Documento |
|---|---|
| Formato exato de token/sessão do provedor de autenticação escolhido | `03` §3.7 |
| Mecanismo de rate limiting/proteção contra força bruta do provedor escolhido | `04` §4.6 |
| Versões/APIs específicas de Expo/React Native no momento da implementação | `12`, `18` |
| Comportamento de splash screen/edge-to-edge na API 36 | `16` §16.4 |
| Mecanismo de armazenamento seguro local via Expo | `16` §16.8 |
| Procedimento de recuperação/rotação de upload key | `18` §18.4.1/18.4.2 |
| Auto-incremento de `versionCode` via EAS | `18` §18.5 |
| Comportamento de rollback de app no Google Play | `22` §22.4 |
| Campo exato de link de exclusão de conta no Console | `20` §20.8 |
| Taxa/processo de verificação de conta de desenvolvedor Google Play vigente | `20` §20.2 |
| Prazo de revisão do Google Play | `20` §20.12 |
| Comportamento exato do contador de 14 dias do teste fechado em caso de queda de testadores | `21` §21.2 |

## 30.4 Glossário

| Termo | Definição |
|---|---|
| `client` | Papel de usuário que agenda atendimentos. |
| `admin` | Papel de usuário associado a um profissional, com acesso à área administrativa e à agenda global. |
| Profissional responsável | O profissional (`professional`) associado a um agendamento específico, base da regra de autorização de escrita. |
| Agenda global | Visão consolidada de todos os agendamentos de todos os profissionais, acessível em leitura a qualquer admin. |
| Double booking | Situação em que dois agendamentos do mesmo profissional possuem intervalos de tempo sobrepostos — deve ser sempre impedida. |
| RLS (Row Level Security) | Mecanismo de banco de dados que aplica políticas de acesso a nível de linha, usado como defesa em profundidade quando disponível na arquitetura de acesso ao banco escolhida. |
| IDOR/BOLA | Classe de vulnerabilidade de referência direta a objeto insegura / quebra de autorização a nível de objeto — acesso indevido a um recurso pertencente a outro usuário. |
| AAB | Android App Bundle — formato de artefato de build exigido pelo Google Play para publicação. |
| Play App Signing | Serviço do Google Play que gerencia a chave de assinatura final de distribuição do app. |
| Teste fechado | Track de testes do Google Play, com requisito formal de testadores/duração para contas pessoais novas, etapa obrigatória antes de acesso à produção. |
| Data Safety | Formulário do Google Play que declara quais dados o app coleta, com qual finalidade e como são tratados. |
| `PENDENTE DE DECISÃO` | Marcação usada nesta documentação para decisões de produto/técnicas ainda não definidas — nunca preenchidas com suposição. |
| `REQUER VALIDAÇÃO OFICIAL` | Marcação usada para itens que dependem de confirmação na documentação oficial vigente de uma plataforma/serviço no momento da implementação. |
