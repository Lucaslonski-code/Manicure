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

Esta lista consolida, para referência rápida, os itens que permanecem marcados como `PENDENTE DE DECISÃO` para definição da proprietária do negócio ou refinamento de produto:

| Item | Documento de origem | Status / Contexto |
|---|---|---|
| Nome comercial definitivo do aplicativo | `01` §1.7 | A definir pela proprietária antes da publicação. |
| Valores definitivos de identidade visual (cores, tipografia, espaçamento, sombras, ícones) | `13` §13.6 | Design system aguardando assets/paleta final. |
| `applicationId` / package name definitivo | `16` §16.3, `20` §20.3 | A registrar conforme domínio/marca final. |
| Prazo mínimo de cancelamento pela cliente (`min_cancellation_notice_minutes`) | `08` §8.11, `05` | Regra de tolerância a definir pelo negócio. |
| Tratamento de agendamentos futuros ao excluir conta de admin | `15` §15.7.2 | Cancelamento automático vs. transferência manual. |
| Hospedagem da página externa de solicitação de exclusão de conta | `15` §15.8 | Domínio e plataforma de hospedagem estática. |
| Exibição de preço de serviços no app | `08` §8.5, `13` §13.2 | Opcional no MVP a critério do estabelecimento. |
| Existência de papel "superadmin" / dono não-profissional | `01` §1.7 | Fora do MVP (duas admins no momento). |
| Suporte a multi-idioma | `01` §1.7 | Fora do MVP (PT-BR prioritário). |
| Travar orientação retrato vs. permitir rotação | `16` §16.4 | Recomendação: portrait locked. |

*Nota:* As decisões arquiteturais de Backend (Supabase BaaS), Banco de Dados (PostgreSQL gerenciado), Autenticação (Supabase Auth), Autorização (PostgreSQL RLS) e Garantia de Concorrência (PostgreSQL `btree_gist` + RPC atômica) foram oficialmente confirmadas e resolvidas (ver `29-decisoes-arquiteturais.md`).

## 30.3 Requisitos que exigem validação oficial antes da implementação

| Item | Documento |
|---|---|
| Versões e compatibilidade de bibliotecas no Expo SDK vigente | `12`, `18` |
| Comportamento de splash screen / edge-to-edge no Android 16 (API 36) | `16` §16.4 |
| Procedimento de rotação/recuperação de upload key no Play App Signing | `18` §18.4.1 |
| Configuração de credenciais no EAS Build | `18` §18.5 |
| Taxa e verificação da conta de desenvolvedor Google Play Console | `20` §20.2 |
| Requisitos vigentes do teste fechado (12 testadores por 14 dias) | `21` §21.2 |

## 30.4 Glossário

| Termo | Definição |
|---|---|
| `client` | Papel de usuário que agenda atendimentos. |
| `admin` | Papel de usuário associado a um profissional, com acesso à área administrativa e à agenda global. |
| Profissional responsável | O profissional (`professionals`) associado a um agendamento específico, base estrutural da regra de autorização de escrita. |
| Agenda global | Visão consolidada de todos os agendamentos de todos os profissionais, acessível para leitura a qualquer admin. |
| Double booking | Situação em que dois agendamentos do mesmo profissional possuem intervalos de tempo sobrepostos — impedida no PostgreSQL via constraint `btree_gist` e RPC atômica. |
| RLS (Row Level Security) | Mecanismo mandatório de segurança no PostgreSQL que impõe políticas de acesso em nível de linha, garantindo que usuários acessem apenas dados autorizados. |
| BaaS (Backend as a Service) | Arquitetura adotada utilizando a plataforma Supabase (PostgreSQL, Supabase Auth, PostgREST, Edge Functions). |
| PostgREST | Camada de API REST do Supabase que expõe o banco PostgreSQL diretamente ao cliente mobile sob proteção estrita de RLS. |
| Edge Functions | Funções server-side em tempo de execução Deno no Supabase para tarefas que exigem chave de serviço (`service_role key`), como envio de push notifications. |
| IDOR / BOLA | Insecure Direct Object Reference / Broken Object Level Authorization — vulnerabilidade mitigada de forma definitiva pelo RLS. |
| AAB | Android App Bundle — formato padrão de empacotamento exigido pelo Google Play. |
| Play App Signing | Serviço de gerenciamento de chaves de assinatura do Google Play. |
