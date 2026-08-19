# 29. Decisões Arquiteturais

Status: CONFIRMADO. Registro consolidado das decisões principais, no formato contexto/decisão/justificativa/
alternativas/consequências/riscos.

## ADR-01 — Android como primeira plataforma

- **Contexto:** produto precisa alcançar rapidamente as clientes do negócio, majoritariamente usuárias
  Android no mercado-alvo (premissa de negócio, não medida formalmente).
- **Decisão:** desenvolver primeiro para Android, com arquitetura que permita expansão futura a iOS.
- **Justificativa:** requisito de produto explícito; reduz escopo inicial de publicação e testes.
- **Alternativas:** desenvolvimento simultâneo Android+iOS (rejeitado — aumenta custo/tempo inicial sem
  benefício claro no MVP); iOS-first (rejeitado — não alinhado à premissa de mercado-alvo).
- **Consequências:** documentação de publicação (Google Play) é aprofundada; documentação de iOS é apenas
  preparatória (`28-arquitetura-futura-ios.md`).
- **Riscos:** se a premissa de mercado-alvo estiver incorreta, a decisão pode exigir revisão — não medido
  formalmente, listado em `30-riscos-pendencias-glossario.md`.

## ADR-02 — React Native + Expo + TypeScript

- **Contexto:** necessidade de app mobile com possibilidade de expansão futura a iOS sem duplicar base de
  código.
- **Decisão:** usar React Native com Expo e TypeScript como stack de frontend mobile.
- **Justificativa:** portabilidade entre Android/iOS (ver ADR-01), tipagem estática (TypeScript) reduz
  classes de erro, ecossistema maduro de bibliotecas compatível com os requisitos do produto (navegação,
  notificações, armazenamento seguro).
- **Alternativas:** desenvolvimento nativo Android (Kotlin) puro — rejeitado por não atender à portabilidade
  futura sem retrabalho total; Flutter — alternativa tecnicamente viável, não escolhida nesta decisão (sem
  critério de exclusão documentado além da escolha direta de React Native/Expo pelo produto).
- **Consequências:** toda a documentação de frontend (`12`, `13`) assume esta stack.
- **Riscos:** dependência da manutenção do ecossistema Expo/React Native; mitigação: acompanhar
  documentação oficial a cada ciclo de manutenção (`27-operacao-manutencao.md`).

## ADR-03 — Backend com PostgreSQL

- **Contexto:** necessidade de banco relacional com suporte a integridade referencial forte e constraints
  avançadas (ex.: prevenção de sobreposição de horários).
- **Decisão:** usar PostgreSQL como banco de dados.
- **Justificativa:** suporte maduro a constraints de integridade, transações com isolamento configurável, e
  (dependendo do provedor de hospedagem escolhido) suporte a políticas de RLS — relevante para a regra
  central de autorização (`04-autorizacao-seguranca.md`, `11-arquitetura-backend.md`, seção 11.4).
- **Alternativas:** banco NoSQL — rejeitado por não oferecer garantias de integridade referencial e
  constraints necessárias ao motor de disponibilidade com a mesma naturalidade.
- **Consequências:** modelo de dados (`08`, `09`) documentado em termos relacionais.
- **Riscos:** escolha do provedor gerenciado específico ainda pendente (`PENDENTE DE DECISÃO`), pode afetar
  disponibilidade de recursos como RLS nativo.

## ADR-04 — Autenticação com verificação de e-mail obrigatória

- **Contexto:** necessidade de garantir identidade mínima confiável antes de permitir uso funcional,
  especialmente relevante dado que agendamentos envolvem compromisso real de horário do negócio.
- **Decisão:** exigir verificação de e-mail antes de liberar uso funcional do app.
- **Justificativa:** reduz contas falsas/descartáveis, alinhado a requisito de produto explícito.
- **Alternativas:** verificação por SMS/telefone — não escolhida como mecanismo obrigatório no MVP,
  telefone é apenas dado de contato (ver `03`).
- **Consequências:** fluxo de autenticação (`03`) inclui estado bloqueante de e-mail não verificado.
- **Riscos:** e-mails de confirmação podem cair em spam/não chegar — mitigação: reenvio disponível na
  interface (RF-AUTH-002, ver `05`).

## ADR-05 — Roles `client`/`admin` com provisionamento manual de admin

- **Contexto:** necessidade de impedir que qualquer pessoa se torne administradora do negócio via cadastro
  público.
- **Decisão:** cadastro público sempre cria `client`; `admin` é provisionado por mecanismo controlado, fora
  do fluxo público.
- **Justificativa:** requisito de segurança e de produto explícito (evitar escalonamento de privilégio via
  cadastro).
- **Alternativas:** aprovação de admin por outro admin dentro do app — não escolhida como mecanismo do MVP;
  `PENDENTE DE DECISÃO` se será adotada no futuro.
- **Consequências:** `03-identidade-roles-autenticacao.md`, seção 3.3.
- **Riscos:** mecanismo manual pode ser mais lento para escalar o negócio a muitas profissionais — aceitável
  no porte atual do negócio (premissa de `01-visao-escopo-atores.md`).

## ADR-06 — Agenda global com escrita restrita ao profissional responsável

- **Contexto:** regra de negócio central do produto — todas as admins colaboram na mesma agenda, mas cada
  uma é responsável apenas pelos próprios atendimentos.
- **Decisão:** leitura ampla (qualquer admin vê tudo), escrita restrita (`current_user.professional_id =
  appointment.professional_id`).
- **Justificativa:** requisito de produto explícito, refletindo a forma real de trabalho colaborativo do
  negócio sem permitir interferência indevida entre profissionais.
- **Alternativas:** agenda totalmente segregada por profissional (sem visão global) — rejeitada,
  contradiz requisito explícito de agenda global; agenda totalmente aberta a edição por qualquer admin —
  rejeitada, contradiz requisito explícito de responsabilidade individual.
- **Consequências:** regra replicada em todos os domínios (ver `26-matriz-rastreabilidade-criterios-aceitacao.md`,
  seção 26.1).
- **Riscos:** falha de implementação desta regra é o risco de segurança mais crítico do produto — ver
  `30-riscos-pendencias-glossario.md`.

## ADR-07 — Autorização aplicada no backend/banco, não no frontend

- **Contexto:** necessidade de garantir que a regra central (ADR-06) não seja contornável.
- **Decisão:** toda autorização de escrita é revalidada no backend (e, quando aplicável, reforçada por
  RLS no banco); o frontend apenas oculta ações não permitidas como medida de UX.
- **Justificativa:** princípio de segurança fundamental — esconder botão não é controle de acesso.
- **Alternativas:** confiar apenas no frontend — rejeitada explicitamente por violar requisito de
  segurança do produto.
- **Consequências:** `04-autorizacao-seguranca.md` é o documento normativo desta decisão.
- **Riscos:** implementação incorreta (ex.: endpoint que esquece a checagem) é mitigada por teste
  automatizado obrigatório dos casos negativos (`24-testes-qa.md`, seção 24.3).

## ADR-08 — Formato AAB e Play App Signing para publicação

- **Contexto:** requisito de plataforma do Google Play.
- **Decisão:** gerar builds de produção em AAB, com Play App Signing habilitado.
- **Justificativa:** requisito padrão vigente do Google Play para novos apps (ver `18-android-build-assinatura-testes.md`).
- **Alternativas:** distribuição apenas via APK direto — não aceito pelo Google Play como caminho padrão de
  publicação em produção.
- **Consequências:** `18-android-build-assinatura-testes.md`, seção 18.4.
- **Riscos:** perda/comprometimento da upload key — mitigado por titularidade adequada de contas (ADR-10) e
  procedimento de recuperação junto ao Google (a confirmar `REQUER VALIDAÇÃO OFICIAL`).

## ADR-09 — `targetSdkVersion` = API 36 (Android 16)

- **Contexto:** requisito vigente do Google Play para novos apps a partir de 31/08/2026, confirmado em
  fontes oficiais na data de consulta de 18/08/2026 (ver `16-android.md`, seção 16.1).
- **Decisão:** adotar API 36 desde o início do desenvolvimento.
- **Justificativa:** evita depender de prazo de extensão e alinha o app ao requisito mais atual no momento
  do desenvolvimento.
- **Alternativas:** desenvolver com API 35 e migrar depois — rejeitada por adicionar retrabalho previsível
  e desnecessário, dado que o requisito de API 36 já é conhecido e próximo.
- **Consequências:** `16-android.md`, `25-criterios-aceitacao.md` (CA-AND-01).
- **Riscos:** política pode mudar novamente antes da publicação real — mitigado por revalidação obrigatória
  a cada ciclo (`27-operacao-manutencao.md`, seção 27.3).

## ADR-10 — Propriedade de contas independente do desenvolvedor

- **Contexto:** risco de dependência exclusiva de uma pessoa física (o desenvolvedor) para a continuidade
  operacional do produto.
- **Decisão:** contas críticas (Google Play Console, backend, domínio, e-mail transacional) devem pertencer
  à proprietária do negócio, com acesso operacional concedido ao desenvolvedor.
- **Justificativa:** continuidade de negócio; mitigação de risco (ver `30-riscos-pendencias-glossario.md`).
- **Alternativas:** manter tudo sob conta do desenvolvedor — rejeitada pelo risco de dependência.
- **Consequências:** `22-deploy-operacao-ambientes.md`, seção 22.6.
- **Riscos:** processo de transferência de titularidade pode ter fricção operacional/burocrática — não
  detalhado nesta documentação (`PENDENTE DE DECISÃO` quanto ao processo exato).

## ADR-11 — Futura possibilidade de iOS

- **Contexto:** requisito de produto de não fechar portas para expansão futura.
- **Decisão:** preparar arquitetura (ADR-02 e demais) para portabilidade, sem desenvolver iOS agora.
- **Justificativa:** custo-benefício — investir em portabilidade tem custo baixo dado ADR-02, benefício alto
  se a expansão for decidida no futuro.
- **Alternativas:** ignorar portabilidade — rejeitada, aumentaria custo de uma eventual expansão futura.
- **Consequências:** `28-arquitetura-futura-ios.md`.
- **Riscos:** nenhum risco imediato — decisão de baixo custo presente.
