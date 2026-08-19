# 01. Visão de Produto, Escopo e Atores

Status: CONFIRMADO, salvo trechos marcados como `PENDENTE DE DECISÃO`.
Origem: requisito de produto (prompts da missão documental).

---

## 1.1 Objetivo do produto

Aplicativo mobile de agendamento para uma profissional/empresa de manicure, permitindo que clientes agendem
atendimentos com profissionais específicos e que administradoras (profissionais/proprietárias) gerenciem
sua agenda de forma centralizada.

## 1.2 Problema resolvido

- Agendamento manual (telefone, mensagens, papel) gera conflitos de horário, esquecimentos e retrabalho.
- Falta de visão consolidada da agenda entre múltiplas profissionais do mesmo negócio.
- Ausência de histórico estruturado de atendimentos e dados de contato da cliente.

## 1.3 Público-alvo

| Ator | Descrição |
|---|---|
| Cliente (`client`) | Pessoa que agenda, altera (dentro das regras) e acompanha seus próprios atendimentos. |
| Administradora/Profissional (`admin`) | Profissional de manicure que atende clientes e administra sua própria agenda; também visualiza a agenda global do negócio. |

Não há, no MVP, ator "superadmin" ou "dono da plataforma" distinto do papel `admin`. Caso essa necessidade
exista no futuro (ex.: dono do negócio sem atender clientes), fica registrado como `PENDENTE DE DECISÃO`.

## 1.4 Limites do MVP

### 1.4.1 Incluído no MVP

- Cadastro e login únicos, com identificação de papel (`client`/`admin`) pós-autenticação.
- Verificação obrigatória de e-mail.
- Cadastro de profissionais, serviços e vínculo profissional-serviço.
- Motor de disponibilidade e agendamento sem conflito (double booking).
- Agenda global para administradoras, com visualização total e escrita restrita ao profissional responsável.
- Cancelamento, alteração e histórico de agendamentos, respeitando regras de autorização.
- Contato da cliente (nome, telefone, e-mail) visível no detalhe do agendamento administrativo.
- Notificações essenciais (confirmação, alteração, cancelamento, lembrete).
- Exclusão de conta (cliente e admin).
- Publicação Android via Google Play (interno, fechado, produção).

### 1.4.2 Explicitamente fora do MVP

- Marketplace multi-negócio (múltiplos salões independentes na mesma instalação).
- Pagamentos in-app, cobrança, split de pagamento, gorjetas.
- Chat entre cliente e profissional.
- Programa de fidelidade, cupons, promoções, gamificação.
- Recomendação/IA de horários, chatbots, assistentes automatizados.
- Aplicativo iOS (apenas arquitetura preparatória é considerada — ver `28-arquitetura-futura-ios.md`).
- Multi-idioma (idioma único: português do Brasil, salvo decisão contrária).
- Avaliações/reviews públicas de profissionais.

Qualquer funcionalidade não listada explicitamente como incluída é considerada fora de escopo do MVP até
decisão contrária registrada em `29-decisoes-arquiteturais.md`.

## 1.5 Premissas

- Existe uma única empresa/negócio operando o aplicativo (não é uma plataforma multi-tenant para múltiplos
  salões independentes).
- Múltiplas profissionais (admins) podem operar dentro do mesmo negócio, cada uma com sua própria agenda.
- O número de profissionais é pequeno (dezenas, não milhares), compatível com um negócio local de manicure.
- A proprietária do negócio decide quem se torna `admin`.

## 1.6 Dependências

- Serviço de autenticação com suporte a verificação de e-mail (ver `03-identidade-roles-autenticacao.md`).
- Backend com banco de dados relacional (PostgreSQL) capaz de aplicar regras de autorização de forma
  confiável (ver `04-autorizacao-seguranca.md`).
- Conta de desenvolvedor Google Play (ver `20-google-play.md`).
- Serviço de notificações push compatível com Android (ver `14-notificacoes.md`).

## 1.7 Decisões pendentes

| Item | Status |
|---|---|
| Existência de papel "superadmin"/dono não-profissional | `PENDENTE DE DECISÃO` |
| Suporte a múltiplos negócios (multi-tenant) | Fora do MVP — não avaliado |
| Idioma único vs. multi-idioma | `PENDENTE DE DECISÃO` (assume-se pt-BR único) |
| Nome comercial definitivo do aplicativo | `PENDENTE DE DECISÃO` |
