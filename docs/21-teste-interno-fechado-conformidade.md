# 21. Teste Interno, Teste Fechado e Matriz de Conformidade

Status: CONFIRMADO. Complementa `20-google-play.md`.

Data da consulta às fontes oficiais: 18 de agosto de 2026 (mesmas fontes de `20-google-play.md`, seção de
cabeçalho).

## 21.1 Teste interno

| Aspecto | Descrição |
|---|---|
| Finalidade | Validação rápida com um grupo pequeno e conhecido (equipe, cliente/proprietária do negócio) antes de qualquer exposição mais ampla. |
| Participantes | Lista de testadores cadastrados por e-mail no Console, definida pelo desenvolvedor/proprietária. |
| Distribuição | Quase imediata após o upload do build, sem revisão de conteúdo tão extensa quanto a de produção. |
| Limitações | Número de testadores limitado (limite definido pela plataforma, a confirmar valor exato vigente — `REQUER VALIDAÇÃO OFICIAL`); não conta, por si só, como cumprimento do requisito de teste fechado para acesso à produção. |

## 21.2 Teste fechado

| Aspecto | Descrição |
|---|---|
| Finalidade | Validação mais próxima da experiência de produção, com grupo maior de testadores reais, e é etapa **obrigatória** para contas pessoais novas antes da produção. |
| Participantes | Testadores convidados pelo desenvolvedor/proprietária (por e-mail ou link de opt-in), que precisam aceitar explicitamente participar (`opt-in`) e instalar o app pela página de teste do Google Play. |
| Convite | Realizado pelo desenvolvedor — não é uma lista fornecida pelo Google. |
| Requisito de contas pessoais novas | Conforme fonte oficial consultada (Play Console Help — "App testing requirements for new personal developer accounts"): contas pessoais criadas **após 13 de novembro de 2023** devem realizar teste fechado com no mínimo **12 testadores** optados continuamente pelos **14 dias** imediatamente anteriores à solicitação de acesso à produção. |
| Contagem do prazo | O período de 14 dias é contado de forma contínua e retroativa a partir do momento da solicitação — interrupções na contagem de testadores ativos (queda abaixo de 12) podem reiniciar a contagem, conforme comportamento observado da plataforma; comportamento exato deve ser confirmado na documentação oficial no momento da execução real (`REQUER VALIDAÇÃO OFICIAL`). |
| Acesso à produção | Após cumprir o requisito, a proprietária/desenvolvedor solicita acesso à produção no Console, respondendo a um questionário sobre o app e o processo de teste. |

### 21.2.1 Esclarecimento explícito sobre os testadores

- Os testadores do teste fechado **não são funcionários do Google** nem fornecidos pelo Google.
- É responsabilidade do desenvolvedor/proprietária **encontrar e convidar** as 12 (ou mais) pessoas.
- Essas pessoas **não precisam ser contratadas** nem remuneradas — participação voluntária é aceitável,
  desde que sigam o processo de opt-in exigido pela plataforma (aceitar o convite, instalar o app, usar
  durante o período).

### 21.2.2 Clientes reais da manicure como testadoras

- É permitido e recomendável considerar clientes reais do negócio como parte do grupo de testadoras do teste
  fechado, **desde que participem voluntariamente** e sigam o processo formal de opt-in exigido pelo Google
  Play (aceitar o link de teste, instalar via Play Store, permanecer participante durante o período).
- Isso constitui, adicionalmente, uma **validação real do produto** com usuárias reais do negócio — mas essa
  validação de produto é um benefício complementar, e não substitui nem dispensa o cumprimento formal das
  regras do Google Play descritas acima.

### 21.2.3 Distinção explícita

`Teste para desenvolvimento` (validação informal, ver `19-distribuicao-privada-cliente.md`) é diferente de
`teste exigido pelo processo de publicação` (teste fechado formal com requisito de 12 testadores/14 dias).
Ambos podem envolver as mesmas pessoas (inclusive a cliente/proprietária e clientes reais do negócio), mas
apenas o segundo conta oficialmente para a liberação de acesso à produção.

---

## 21.3 Matriz de conformidade — Google Play

| Item | Aplicável | Requisito | Evidência necessária | Risco se não atendido | Status |
|---|---|---|---|---|---|
| Privacidade | Sim | Política de privacidade pública com URL válida | Link publicado e acessível | Rejeição na revisão | `PENDENTE DE DECISÃO` (redação e hospedagem) |
| Dados / Data Safety | Sim | Formulário de Data Safety preenchido de forma precisa | Mapeamento de dados coletados (ver `20-google-play.md`, seção 20.7) | Rejeição ou suspensão por declaração incorreta | Mapeamento técnico pronto; preenchimento formal pendente de submissão real |
| Permissões | Sim | Solicitar apenas permissões necessárias, justificadas | Lista de permissões (ver `17-android-permissoes.md`) | Questionamento/rejeição por permissão não justificada | Confirmado — apenas Internet e Notificações |
| Segurança | Sim | Comunicação via TLS, autenticação segura, proteção de dados de usuários | Arquitetura de segurança (ver `04-autorizacao-seguranca.md`) | Vulnerabilidade explorável, dano reputacional | Documentado; validação técnica ocorre na implementação |
| Contas | Sim | Login/cadastro seguros, sem criação pública de admin | Modelo de autenticação e autorização (docs 03 e 04) | Escalonamento de privilégio | Documentado |
| Exclusão de conta | Sim | Exclusão disponível no app e por página externa | Fluxo documentado em `15-privacidade-exclusao-conta.md` | Rejeição na revisão | Fluxo interno definido; página externa `PENDENTE DE DECISÃO` de implementação |
| Classificação de conteúdo | Sim | Questionário preenchido com precisão | Resultado do questionário no Console | Classificação incorreta pode gerar rejeição | A preencher na submissão real |
| Conteúdo / Propriedade intelectual | Sim, mas baixo risco | Nenhum conteúdo de terceiros protegido por direitos autorais utilizado indevidamente (ícones, textos, imagens próprios ou licenciados) | Ativos visuais originais/licenciados | Remoção do app por violação de PI | A garantir na produção dos ativos visuais (ver `13-ux-ui-design-system.md`) |
| Pagamentos | Não aplicável | Sem funcionalidade de pagamento no MVP (ver `01-visao-escopo-atores.md`) | — | — | Fora de escopo |
| Comportamento enganoso | Sim, baixo risco | Ficha da loja deve descrever fielmente a funcionalidade do app | Descrição precisa, sem promessas não implementadas | Rejeição/remoção por "enganação" | A garantir na redação da ficha da loja |
| Acesso para revisão | Sim | Credenciais de demonstração fornecidas ao revisor | Conta de teste dedicada (ver `20-google-play.md`, seção 20.10) | Rejeição por impossibilidade de revisão | `PENDENTE DE DECISÃO` quanto à criação da conta de demonstração |
| Publicação/Testes | Sim | Cumprir teste fechado (12/14 dias) para contas pessoais novas | Relatório de testadores optados no Console | Bloqueio de acesso à produção | Processo documentado; execução ocorre na fase de publicação real |

Esta matriz deve ser revisada a cada mudança relevante de política do Google Play ou de escopo do produto.
