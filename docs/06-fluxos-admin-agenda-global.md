# 06. Fluxos da Administradora e Agenda Global

Status: CONFIRMADO.

## 6.1 Princípio

O login é o **mesmo** utilizado pela cliente (ver `03-identidade-roles-autenticacao.md`). Não existe tela de
login administrativa separada, nem seletor de papel. Após autenticação, se `role = admin`, o sistema
direciona para a área administrativa.

## 6.2 Mapa geral de telas (Admin)

```
Login (compartilhado)
  → (autenticado, verificado, role=admin)
  → Dashboard
     → Agenda Global
        → Filtros / Busca
        → Detalhes do Agendamento
           → Ações (se professional_id = próprio): Editar / Cancelar / Excluir / Reagendar
           → Ações indisponíveis (se professional_id ≠ próprio): somente visualização
     → Disponibilidade (própria)
        → Jornada de trabalho
        → Bloqueios/Folgas
     → Serviços (próprios / do negócio, conforme decisão de escopo)
  → Perfil
     → Exclusão de Conta
```

## 6.3 Dashboard

- Visão geral: próximos atendimentos do próprio profissional, atalho para agenda global.
- Não substitui a agenda global; é um resumo de conveniência.

## 6.4 Agenda Global

Todos os admins visualizam **exatamente o mesmo conjunto** de agendamentos — não há filtragem por
propriedade na leitura (ver regra central em `04-autorizacao-seguranca.md`).

### 6.4.1 Informações exibidas por atendimento

| Campo | Obrigatório na exibição |
|---|---|
| Profissional | Sim |
| Cliente (nome) | Sim |
| Data | Sim |
| Horário inicial | Sim |
| Horário final | Sim |
| Serviço | Sim |
| Observação | Sim (quando existente) |
| Telefone da cliente | Sim |
| E-mail da cliente | Sim |
| Status | Sim |

### 6.4.2 Visões de calendário

- Diária, semanal e mensal (RF-AGENDA-001).
- Cada visão exibe agendamentos de todos os profissionais, com indicação visual de qual profissional
  pertence cada item (ex.: cor ou rótulo por profissional).

### 6.4.3 Filtros e busca

- Filtro por profissional (RF-AGENDA-002).
- Filtro por serviço.
- Filtro por status (confirmado, cancelado, concluído).
- Filtro por data/período.
- Busca textual por nome da cliente (RF-AGENDA-003).

### 6.4.4 Ordenação

- Padrão: cronológica (horário inicial ascendente).

### 6.4.5 Estados vazios

- Nenhum agendamento no período/filtro selecionado: mensagem informativa, sem erro.

### 6.4.6 Indicadores

- Contagem de agendamentos por status no período (ex.: "12 confirmados, 2 cancelados hoje") — desejável,
  não obrigatório no MVP.

## 6.5 Detalhes do Agendamento (visão administrativa)

Exibe todos os campos da seção 6.4.1, mais dados de contato completos para viabilizar contato externo
(telefone e e-mail). Formas concretas de contato (ligação, e-mail, mensagem) não presumem integração nativa
com aplicativos de terceiros (ex.: WhatsApp); o app pode, no máximo, oferecer ações padrão do sistema
operacional (discar número, abrir cliente de e-mail), a confirmar como decisão de UX —
`PENDENTE DE DECISÃO` quanto à implementação exata dessas ações de atalho.

### 6.5.1 Diferenciação visual obrigatória: "pode visualizar" x "pode alterar"

Quando `appointment.professional_id = current_admin.professional_id`:

- Botões de Editar, Cancelar, Excluir e Reagendar visíveis e habilitados.

Quando `appointment.professional_id ≠ current_admin.professional_id`:

- Botões de escrita ocultos ou visivelmente desabilitados, com indicação textual (ex.: "Somente o
  profissional responsável pode alterar este atendimento").
- Essa ocultação é exclusivamente uma medida de UX/prevenção de erro; a autorização efetiva é sempre
  revalidada no backend (ver `04-autorizacao-seguranca.md`, seção 4.3).

## 6.6 Disponibilidade e bloqueios (próprios)

- Cada admin gerencia apenas a jornada e os bloqueios do **próprio** profissional associado
  (RF-AVAIL-001, RF-AVAIL-002).
- Um admin não pode alterar a jornada/bloqueios de outro profissional — mesma regra de responsabilidade
  aplicada a agendamentos se estende a disponibilidade.

## 6.7 Serviços

- Gestão de serviços (RF-CAT-003, RF-CAT-004): escopo de propriedade de serviços (se por profissional
  individual ou compartilhado entre todos os profissionais do negócio) é `PENDENTE DE DECISÃO`. Até decisão
  contrária, assume-se que o catálogo de serviços é compartilhado (visível a todos os admins), mas o vínculo
  profissional-serviço (quais serviços cada profissional oferece, com sua duração) é individual.

## 6.8 Perfil e exclusão de conta (admin)

- Mesma estrutura conceitual do fluxo da cliente (ver `05-fluxos-cliente.md`, seção "Perfil"), com o
  detalhamento de exclusão de conta administrativa em `15-privacidade-exclusao-conta.md` (inclui tratamento
  específico dos agendamentos vinculados ao profissional).

## 6.9 Cenários de erro e exceção (transversais ao fluxo administrativo)

| Cenário | Comportamento esperado |
|---|---|
| Client tenta acessar área administrativa | Bloqueio de navegação no frontend e `403` do backend caso a rota de API seja chamada diretamente. |
| Admin tenta alterar agendamento de outro profissional via ação direta na API | `403 Forbidden`, nenhuma alteração persistida (ver cenário de ataque em `04-autorizacao-seguranca.md`). |
| Sessão expirada | Redirecionamento para Login. |
| E-mail não verificado | Redirecionamento para Confirmação de e-mail (mesma regra do cliente). |
| Erro de rede ao carregar agenda | Estado de erro com opção de tentar novamente; dados já carregados permanecem visíveis quando possível. |
| Agendamento não encontrado (excluído/alterado por outro processo) | Mensagem "agendamento não encontrado ou alterado", retorno à agenda global. |
