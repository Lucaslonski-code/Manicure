# 07. Motor de Disponibilidade e Prevenção de Double Booking

Status: CONFIRMADO. Documento estritamente conceitual — nenhum trecho constitui implementação executável.

## 7.1 Entradas do motor de disponibilidade

| Entrada | Origem | Descrição |
|---|---|---|
| Jornada do profissional | `availability` | Dias da semana e intervalos de horário em que o profissional atende. |
| Bloqueios/folgas | `blocked_times` | Períodos específicos indisponíveis, mesmo dentro da jornada padrão. |
| Duração do serviço | `services` / `professional_services` | Tempo necessário para execução do serviço selecionado. |
| Agendamentos existentes | `appointments` | Intervalos já ocupados (status ativo) do profissional. |
| Fuso horário | `business_settings` ou configuração fixa do negócio | Referência única de fuso horário para todo o negócio (ver 7.5). |
| Data/hora da consulta | Requisição da cliente | Janela de datas a considerar (ex.: próximos N dias). |

## 7.2 Conceito de intervalo do agendamento

Cada agendamento é representado conceitualmente por um intervalo:

```
start_at = data + horário selecionado
end_at   = start_at + duração do serviço
```

Um horário é elegível para oferta à cliente somente se o intervalo `[start_at, end_at)` estiver:

1. Contido em algum intervalo de jornada do profissional para o dia da semana correspondente;
2. Fora de qualquer bloqueio/folga registrado (`blocked_times`) que intersecte `[start_at, end_at)`;
3. Sem sobreposição com qualquer `appointment` existente e ativo do mesmo profissional.

## 7.3 Definição formal de sobreposição (conflito)

Dois intervalos `[A_start, A_end)` e `[B_start, B_end)` do mesmo profissional estão em conflito se:

```
A_start < B_end  E  B_start < A_end
```

Qualquer novo agendamento cujo intervalo entre em conflito com um agendamento existente **ativo** (não
cancelado) do mesmo profissional deve ser rejeitado.

## 7.4 Validações adicionais antes de aceitar um agendamento

| Validação | Consequência se falhar |
|---|---|
| Profissional está ativo | Rejeitar — profissional inativo não pode ser agendado |
| Serviço está ativo | Rejeitar — serviço inativo não pode ser selecionado |
| Profissional oferece o serviço (`professional_services`) | Rejeitar — combinação inválida |
| Horário dentro da jornada do profissional | Rejeitar — fora de expediente |
| Ausência de bloqueio no intervalo | Rejeitar — período bloqueado |
| Ausência de conflito com agendamento existente | Rejeitar — double booking |
| Data/horário não está no passado | Rejeitar — agendamento retroativo inválido |

## 7.5 Fuso horário

O negócio opera em um único fuso horário de referência (ex.: horário local do estabelecimento). Toda
persistência de `start_at`/`end_at` deve utilizar uma representação inequívoca (momento absoluto,
tipicamente UTC internamente, convertido para exibição no fuso do negócio). A escolha exata do fuso e da
estratégia de armazenamento (UTC internamente vs. horário local fixo) é `PENDENTE DE DECISÃO` de
implementação, mas deve ser única e consistente em todo o sistema — nunca variável por dispositivo do
usuário.

## 7.6 Concorrência e prevenção formal de double booking

**Problema:** duas clientes podem, quase simultaneamente, solicitar o mesmo horário para o mesmo
profissional. Uma verificação de disponibilidade feita apenas no momento da consulta (antes da confirmação)
não é suficiente, pois outra requisição pode ser confirmada no intervalo entre a consulta e a escrita.

**Requisito formal (RNF-CONCUR-001):** a garantia de ausência de sobreposição deve ser assegurada pelo
backend/banco no momento da escrita, não apenas pela interface ou por uma checagem prévia isolada.

**Estratégias conceituais aceitáveis** (a decisão de qual mecanismo concreto usar é de implementação,
documentada aqui apenas conceitualmente):

1. **Constraint de exclusão no banco** — o banco de dados relacional impede, a nível de integridade, a
   existência de dois registros ativos de `appointments` para o mesmo `professional_id` com intervalos de
   tempo sobrepostos. Esta é a estratégia de maior garantia, pois independe da lógica de aplicação.
2. **Transação com verificação e bloqueio** — a operação de criação de agendamento é executada dentro de
   uma transação que verifica ausência de conflito e insere o novo registro de forma atômica, com nível de
   isolamento suficiente para impedir leitura de dados desatualizados durante a verificação concorrente.

A escolha entre essas estratégias (ou combinação de ambas) é `PENDENTE DE DECISÃO` técnica de implementação,
mas **qualquer** escolha deve satisfazer o requisito formal acima. A validação exclusivamente no aplicativo
mobile (frontend) nunca é suficiente e não substitui a garantia no backend/banco.

## 7.7 Comportamento quando o horário deixa de estar disponível entre seleção e confirmação

Fluxo esperado:

1. Cliente seleciona horário na tela "Horários disponíveis" (consulta de leitura, sem reserva).
2. Cliente revisa o Resumo.
3. Cliente confirma — requisição de criação de agendamento é enviada.
4. Backend revalida disponibilidade no momento da escrita (seção 7.6).
5. Se o horário não estiver mais disponível: a criação é rejeitada com erro específico de conflito (HTTP
   409, ver `08-api-especificacao.md`), e o frontend informa a cliente e retorna à tela de horários com a
   lista atualizada.
6. Se disponível: agendamento é criado e confirmado.

Não existe "reserva temporária" de horário durante a navegação da cliente (ex.: trava de 5 minutos ao
selecionar) no escopo do MVP — comportamento futuro possível, registrado como `PENDENTE DE DECISÃO`.

## 7.8 Feriados

Suporte a feriados como bloqueio automático não está definido no MVP. Feriados, se necessários, devem ser
registrados manualmente como `blocked_times` pelo admin. Suporte automático a calendário de feriados é
`PENDENTE DE DECISÃO` (fora do MVP).
