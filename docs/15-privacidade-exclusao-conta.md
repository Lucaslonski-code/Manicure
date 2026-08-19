# 15. Privacidade, Dados Pessoais e Exclusão de Conta

Status: CONFIRMADO quanto à estrutura. Não constitui texto jurídico de política de privacidade — apenas
especificação técnica de tratamento de dados, a ser usada como insumo para a política de privacidade
publicável (redigida separadamente por quem de direito).

## 15.1 Dados pessoais tratados pelo aplicativo

| Dado | Finalidade | Origem |
|---|---|---|
| Nome | Identificação da cliente/profissional em agendamentos e contato. | Cadastro |
| E-mail | Autenticação, verificação de conta, comunicação transacional, recuperação de senha. | Cadastro |
| Telefone | Contato relacionado ao agendamento (visível ao admin responsável e demais admins na agenda global). | Cadastro |
| Dados de autenticação (senha com hash, tokens de sessão) | Autenticação e manutenção de sessão. | Cadastro/Login |
| Agendamentos (data, horário, serviço, profissional) | Operação central do produto. | Uso do app |
| Observações (`client_note`, `admin_note`) | Contexto adicional do atendimento. | Uso do app |
| Token de dispositivo (push) | Envio de notificações. | Uso do app, após permissão |
| Dados técnicos mínimos (logs de erro, auditoria de ações sensíveis) | Segurança, diagnóstico, auditoria. | Operação do sistema |

Nenhum dado além dos listados é coletado no MVP (sem geolocalização, sem acesso a contatos do dispositivo,
sem câmera/fotos — ver `17-android-permissoes.md`).

## 15.2 Acesso aos dados

| Dado | Quem acessa |
|---|---|
| Perfil da cliente (nome, e-mail, telefone) | A própria cliente; qualquer admin, no contexto de um agendamento dela (agenda global — RF-APPT-013). |
| Perfil do admin (nome, e-mail, telefone) | O próprio admin. Exposição a clientes limitada ao nome de exibição do profissional (`professionals.display_name`); e-mail/telefone do admin não são expostos à cliente no MVP — `PENDENTE DE DECISÃO` caso isso mude. |
| Agendamentos | Cliente titular; qualquer admin (leitura global); escrita restrita ao admin responsável (ver `04-autorizacao-seguranca.md`). |
| Observações administrativas (`admin_note`) | Visível a qualquer admin na leitura da agenda global (mesmo tratamento de leitura ampla); edição restrita ao admin responsável. |

## 15.3 Armazenamento e segurança

- Dados armazenados no banco de dados do backend (PostgreSQL — ver `20-decisoes-arquiteturais.md`), com
  acesso restrito por credenciais de serviço (não expostas ao app — ver `16-ambientes-secrets.md`,
  consolidado em `18-deploy-operacao.md`).
- Senhas armazenadas exclusivamente como hash (nunca texto puro) — ver `RNF-SEC-002`.
- Comunicação sempre via HTTPS/TLS — ver `RNF-SEC-003`.
- Armazenamento local no dispositivo restrito a sessão/token (armazenamento seguro) — ver `16-android.md`.

## 15.4 Compartilhamento

- Nenhum dado pessoal é compartilhado com terceiros para fins de marketing ou publicidade no MVP.
- Compartilhamento técnico necessário à operação (ex.: serviço de envio de e-mail transacional, serviço de
  push notification) é limitado ao mínimo necessário para a funcionalidade (endereço de e-mail para envio de
  confirmação; token de dispositivo para push) — fornecedores concretos a definir em
  `20-decisoes-arquiteturais.md`.

## 15.5 Retenção

- Dados de conta e agendamentos são retidos enquanto a conta estiver ativa.
- Após exclusão de conta (ver 15.7), dados pessoais diretamente identificáveis são removidos ou anonimizados,
  conforme detalhado a seguir, preservando o mínimo necessário para integridade de histórico de terceiros
  (ex.: o admin ainda enxerga que houve um atendimento, sem necessariamente reter dados de contato da
  cliente que excluiu a conta).
- Prazo exato de retenção de registros de auditoria (`audit_logs`) após exclusão de conta: `PENDENTE DE
  DECISÃO`.

## 15.6 Anonimização

Quando a exclusão completa de um registro comprometeria a integridade de um relacionamento necessário a
terceiros (ex.: um `appointment` histórico que o admin responsável precisa manter em seu próprio histórico
de atendimentos), a estratégia é **anonimização** dos dados identificáveis da cliente associados àquele
registro (ex.: substituição de nome/telefone/e-mail exibidos por indicação de "cliente removida"), mantendo
o registro do agendamento em si (data, horário, serviço, status) para fins de histórico do profissional.

## 15.7 Fluxo de exclusão de conta

### 15.7.1 Cliente

```
Perfil → Excluir Conta → Confirmação explícita → Requisição ao backend
   → Backend:
       - Marca a conta como excluída (deleted_at) e desativa autenticação.
       - Anonimiza dados diretamente identificáveis (nome, e-mail, telefone) nos registros
         de appointments históricos vinculados, preservando o registro para o histórico do
         profissional responsável.
       - Cancela agendamentos futuros ainda ativos (status = cancelled), notificando o admin
         responsável.
       - Remove tokens de push associados.
       - Registra o evento em audit_logs.
   → App: encerra sessão local, retorna à tela de login com confirmação de exclusão concluída.
```

### 15.7.2 Admin

```
Perfil → Excluir Conta → Confirmação explícita → Requisição ao backend
   → Backend:
       - Marca a conta como excluída e desativa autenticação.
       - Marca o registro em `professionals` vinculado como inativo (is_active = false),
         impedindo novos agendamentos para esse profissional.
       - Agendamentos futuros já existentes: PENDENTE DE DECISÃO quanto ao tratamento exato
         (cancelamento automático com notificação à cliente, ou transferência a outro admin —
         não definido; não deve ser resolvido silenciosamente na implementação sem decisão de
         produto).
       - Histórico de agendamentos passados é preservado para consulta futura por outros
         admins (agenda global), com o profissional identificado como inativo.
       - Registra o evento em audit_logs.
```

O tratamento de agendamentos futuros de um admin que exclui a própria conta é registrado explicitamente como
`PENDENTE DE DECISÃO` — não deve ser assumido nem implementado silenciosamente sem definição de produto,
dado o impacto direto em clientes com atendimentos marcados.

## 15.8 Requisitos da Google Play para exclusão de conta

A Google Play exige, para aplicativos que permitem criação de conta, que a exclusão de conta esteja
disponível tanto **dentro do aplicativo** quanto por meio de um **recurso acessível fora do aplicativo**
(tipicamente uma página web), permitindo que a solicitação de exclusão seja feita mesmo por quem não tem mais
acesso ao app instalado. Este é um requisito de política vigente da Google Play — os detalhes exatos de
formato e prazo devem ser conferidos na documentação oficial da Google Play Console vigente no momento da
publicação (`REQUER VALIDAÇÃO OFICIAL`; ver também `17-google-play.md`, seção de Data Safety/exclusão de
conta).

Consequência arquitetural: além do fluxo dentro do app (15.7), o produto precisa de uma página externa
simples (fora do app) onde o usuário possa solicitar a exclusão de sua conta, mesmo sem o aplicativo
instalado. A existência, hospedagem e responsável por essa página é `PENDENTE DE DECISÃO` de implementação
(ver também `19-propriedade-contas.md`, quando consolidado em `18-deploy-operacao.md`).

## 15.9 Dados não excluídos por obrigação legal/operacional

Registros de auditoria/segurança podem ser retidos por período limitado mesmo após exclusão de conta, para
fins de investigação de fraude/abuso, sem incluir dados diretamente identificáveis desnecessários. Prazo
exato: `PENDENTE DE DECISÃO`.
