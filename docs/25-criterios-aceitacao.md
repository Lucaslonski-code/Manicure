# 25. Critérios de Aceitação

Status: CONFIRMADO. Cada critério é verificável e referenciado na matriz de rastreabilidade
(`26-matriz-rastreabilidade-criterios-aceitacao.md`).

## 25.1 Cadastro e verificação de e-mail

| ID | Critério |
|---|---|
| CA-CAD-01 | Cadastro com dados válidos cria conta com `role = client` e `email_verified = false`. |
| CA-CAD-02 | Não é possível cadastrar dois usuários com o mesmo e-mail. |
| CA-CAD-03 | Não existe campo, parâmetro ou tela que permita ao cadastro público resultar em `role = admin`. |
| CA-EMAIL-01 | Conta com `email_verified = false` não acessa nenhuma tela funcional além da confirmação de e-mail. |
| CA-EMAIL-02 | Confirmação bem-sucedida altera `email_verified` para `true` e libera o fluxo correspondente ao role. |

## 25.2 Login e role

| ID | Critério |
|---|---|
| CA-LOGIN-01 | Existe uma única tela de login, usada por `client` e `admin`. |
| CA-LOGIN-02 | Após login, o app direciona automaticamente para o fluxo correto (`client` ou `admin`) com base em dado retornado pelo backend, nunca por escolha do usuário. |
| CA-LOGIN-03 | Login com credenciais inválidas ou conta inexistente retorna a mesma mensagem genérica de erro. |
| CA-LOGIN-04 | Login com conta desativada é rejeitado com mensagem genérica. |

## 25.3 Agenda e agendamento

| ID | Critério |
|---|---|
| CA-AGENDA-01 | Todo admin autenticado e verificado visualiza a agenda global completa (todos os profissionais). |
| CA-AGENDA-02 | Cada item da agenda exibe profissional, cliente, data, horário inicial e final, serviço, observação, telefone, e-mail e status. |
| CA-APPT-01 | Não é possível criar um agendamento cujo intervalo colida com outro agendamento ativo do mesmo profissional. |
| CA-APPT-02 | Horários oferecidos à cliente respeitam jornada, bloqueios e duração do serviço selecionado. |
| CA-APPT-03 | Se o horário deixar de estar disponível entre a seleção e a confirmação, a criação é rejeitada com erro de conflito, e a cliente é informada. |
| CA-APPT-04 | Duas requisições concorrentes para o mesmo horário/profissional resultam em exatamente uma criação bem-sucedida. |

## 25.4 Autorização (regra central)

| ID | Critério |
|---|---|
| CA-AUTZ-01 | Um admin só consegue editar, cancelar, excluir ou reagendar agendamentos cujo `professional_id` corresponde ao profissional a que está vinculado. |
| CA-AUTZ-02 | Tentativa de um admin de escrever em agendamento de outro profissional retorna erro de autorização e não altera o registro, tanto pela interface (bloqueada) quanto por chamada direta à API (bloqueada no backend). |
| CA-AUTZ-03 | A leitura da agenda global nunca é restrita por propriedade — qualquer admin lê qualquer agendamento. |
| CA-AUTZ-04 | Uma conta `client` não acessa nenhuma rota/tela exclusiva de `admin`, mesmo por navegação direta/deep link. |

## 25.5 Notificações

| ID | Critério |
|---|---|
| CA-NOTIF-01 | Criação de agendamento dispara notificação de confirmação à cliente e ao admin responsável. |
| CA-NOTIF-02 | Cancelamento dispara notificação à parte que não originou a ação. |
| CA-NOTIF-03 | Negação de permissão de notificações não impede o uso funcional do restante do app. |

## 25.6 Exclusão de conta

| ID | Critério |
|---|---|
| CA-DEL-01 | Cliente consegue solicitar exclusão da própria conta dentro do app, com confirmação explícita. |
| CA-DEL-02 | Após exclusão, a conta não autentica mais, e dados diretamente identificáveis são anonimizados nos registros históricos preservados para o profissional. |
| CA-DEL-03 | Existe um mecanismo de solicitação de exclusão de conta acessível fora do aplicativo (página externa), conforme exigência do Google Play. |
| CA-DEL-04 | Agendamentos futuros ativos da cliente excluída são cancelados, com notificação ao admin responsável. |

## 25.7 Segurança

| ID | Critério |
|---|---|
| CA-SEC-01 | Nenhuma senha é armazenada em texto puro no banco de dados. |
| CA-SEC-02 | Toda comunicação entre app e backend ocorre via HTTPS/TLS. |
| CA-SEC-03 | Toda tentativa de escrita negada por autorização gera registro em `audit_logs`. |
| CA-SEC-04 | Nenhum endpoint aceita `role` ou `professional_id` como parâmetro de entrada controlável pelo cliente para decidir autorização. |

## 25.8 Android e publicação

| ID | Critério |
|---|---|
| CA-AND-01 | `targetSdkVersion` do app corresponde ao requisito vigente do Google Play na data da submissão (API 36 confirmado na data de consulta deste documento — ver `16-android.md`, seção 16.1). |
| CA-AND-02 | O app solicita apenas as permissões listadas em `17-android-permissoes.md`. |
| CA-PLAY-01 | AAB gerado e assinado corretamente (Play App Signing configurado) antes do envio ao Console. |
| CA-PLAY-02 | Data Safety preenchido de forma consistente com o mapeamento de dados de `20-google-play.md`, seção 20.7. |
| CA-PLAY-03 | Política de privacidade publicada e acessível antes da submissão. |
| CA-PLAY-04 | Teste fechado cumpre, quando aplicável ao tipo de conta, o requisito de 12 testadores optados continuamente por 14 dias antes da solicitação de acesso à produção. |
| CA-PLAY-05 | Acesso de revisão (conta de demonstração) disponibilizado ao Google antes da submissão. |

## 25.9 Cenários negativos obrigatórios (reafirmados de `24-testes-qa.md`)

- Ana 1 tentando modificar Ana 2 → bloqueado.
- Ana 2 tentando modificar Ana 1 → bloqueado.
- Cliente tentando acessar área administrativa → bloqueado.
- Usuário não verificado tentando usar o app → bloqueado.
- Duas clientes tentando ocupar o mesmo horário → apenas uma é aceita.

Todos os cenários acima possuem critério de aceitação correspondente nas seções 25.3 e 25.4 e caso de teste
correspondente em `24-testes-qa.md`.
