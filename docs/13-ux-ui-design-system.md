# 13. UX/UI e Design System

Status: CONFIRMADO quanto à estrutura e princípios. Valores visuais definitivos (cores, tipografia)
`PENDENTE DE DECISÃO` onde indicado — não inventados.

## 13.1 Princípios de UX (transversais a cliente e admin)

| Princípio | Aplicação |
|---|---|
| Simplicidade | Fluxo de agendamento em etapas curtas e lineares (profissional → serviço → data → horário → resumo → confirmação). |
| Clareza | Estados (confirmado, cancelado, concluído) sempre visíveis com rótulo textual, não apenas cor. |
| Confiança | Resumo explícito antes de qualquer confirmação; feedback claro de sucesso/erro. |
| Poucos passos | Nenhuma etapa redundante; dados já informados não são solicitados novamente na mesma sessão de fluxo. |
| Feedback | Toda ação (salvar, cancelar, excluir) produz retorno visual imediato (sucesso, erro, carregando). |
| Prevenção de erro | Ações destrutivas (cancelar, excluir, excluir conta) exigem confirmação explícita. |
| Acessibilidade | Ver seção 13.5. |
| Consistência | Mesmos componentes visuais para os mesmos conceitos em toda a aplicação (ex.: badge de status idêntico em todas as telas que exibem agendamento). |

## 13.2 Telas — Cliente

Lista de telas e seu propósito já detalhados em `05-fluxos-cliente.md`. Este documento acrescenta apenas
diretrizes visuais/interação transversais:

- **Splash:** sem interação; tempo mínimo apenas o necessário para resolução de sessão.
- **Login/Cadastro:** formulário único por tela, campo de senha com opção de exibir/ocultar, mensagens de
  erro posicionadas próximas ao campo relevante.
- **Home:** destaque para próximo agendamento (se existir) e ação primária "Agendar".
- **Seleção de Profissional/Serviço:** listagem em cartões, com nome, e — quando aplicável — duração/preço
  (exibição de preço: `PENDENTE DE DECISÃO`, ver `08-modelo-banco-dados.md`, seção 8.5).
- **Calendário/Horários:** seleção de data em componente de calendário; horários apresentados em grade ou
  lista, com horários indisponíveis visivelmente desabilitados (não apenas ausentes) — decisão exata entre
  "desabilitar" e "omitir" é `PENDENTE DE DECISÃO`.
- **Resumo/Confirmação:** todos os dados do agendamento visíveis antes da ação final "Confirmar".
- **Meus Agendamentos/Histórico:** listas separadas ou com filtro (futuro/passado), status sempre visível.
- **Perfil/Exclusão de Conta:** ação de exclusão isolada visualmente das demais ações de perfil, com
  confirmação explícita (ver `15-privacidade-exclusao-conta.md`).

## 13.3 Telas — Admin

Lista de telas e propósito detalhados em `06-fluxos-admin-agenda-global.md`. Diretrizes adicionais:

- **Dashboard:** visão resumida, não substitui a agenda global.
- **Agenda Global:** cada item exibe, no mínimo em modo compacto: horário, cliente, serviço, status,
  indicador de profissional (ex.: cor/etiqueta). Toque no item abre o detalhe completo.
- **Detalhes do Agendamento:** exibe todos os campos definidos em `06-fluxos-admin-agenda-global.md`, seção
  6.4.1, incluindo telefone e e-mail da cliente, com formatação clara e ações de contato (discar, abrir
  e-mail) quando disponíveis.

### 13.3.1 Diferenciação visual obrigatória — "pode visualizar" x "pode alterar"

| Situação | Tratamento visual |
|---|---|
| Agendamento do próprio profissional (admin autenticado) | Botões de ação (Editar, Cancelar, Excluir, Reagendar) visíveis e habilitados, com destaque de cor primária. |
| Agendamento de outro profissional | Botões de ação ausentes ou substituídos por rótulo neutro (ex.: "Somente leitura — responsável: [nome do profissional]"). Nenhum botão desabilitado deve "parecer clicável" (evitar apenas reduzir opacidade sem indicação textual). |

Essa diferenciação é medida de UX/prevenção de erro; a autorização efetiva é sempre revalidada no backend
(ver `04-autorizacao-seguranca.md`).

## 13.4 Design System — componentes

| Componente | Uso |
|---|---|
| Botão primário | Ação principal da tela (ex.: "Confirmar agendamento"). |
| Botão secundário | Ação alternativa (ex.: "Cancelar", "Voltar"). |
| Botão destrutivo | Ações irreversíveis (ex.: "Excluir agendamento", "Excluir conta"), com confirmação obrigatória. |
| Input de texto | Campos de formulário, com estado de erro/válido. |
| Card | Listagem de profissionais, serviços, agendamentos. |
| Calendário | Seleção de data (cliente) e visão diária/semanal/mensal (admin). |
| Badge de status | Indicação textual + cor de `confirmed`/`cancelled`/`completed`. |
| Modal de confirmação | Ações destrutivas e exclusão de conta. |
| Estado vazio | Ilustração/texto + ação sugerida quando não há dados. |
| Estado de erro | Mensagem + ação "tentar novamente". |
| Estado de carregamento | Indicador de progresso, sem bloquear indefinidamente sem feedback. |

## 13.5 Acessibilidade

- Contraste mínimo adequado entre texto e fundo (a validar contra diretrizes de acessibilidade mobile no
  momento da definição visual final — `REQUER VALIDAÇÃO OFICIAL`).
- Área de toque mínima adequada para elementos interativos (botões, itens de lista).
- Rótulos textuais em ícones e ações, compatíveis com leitores de tela.
- Status de agendamento comunicado por texto, não apenas por cor (para usuários com daltonismo).
- Formulários com mensagens de erro associadas ao campo correspondente, legíveis por leitor de tela.

## 13.6 Valores visuais — cores, tipografia, espaçamento, radius, sombras, ícones

Nenhum valor definitivo (paleta de cores, família tipográfica, escala de espaçamento, raio de borda,
elevação/sombra, biblioteca de ícones) foi definido pelo produto até o momento da elaboração deste
documento. Registrar como:

`PENDENTE DE DECISÃO — identidade visual definitiva do produto.`

Recomenda-se, quando a decisão for tomada, documentá-la neste mesmo arquivo, substituindo esta seção, sem
necessidade de reestruturar os demais documentos (que referenciam apenas os componentes conceituais acima,
não valores específicos).
