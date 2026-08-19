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
PostgreSQL/Supabase no momento da escrita, não apenas pela interface ou por uma checagem prévia isolada.

**Estratégia oficial adotada no PostgreSQL (Supabase):**

1. **Constraint de exclusão no PostgreSQL (`EXCLUDE USING gist`):**
   Utilização da extensão `btree_gist` para garantir, a nível de engine do banco de dados, que não possam existir dois registros em `appointments` com o mesmo `professional_id`, com intervalos de tempo `tsrange(start_at, end_at)` sobrepostos, onde `status = 'confirmed'`.
2. **Operação Atômica via PostgreSQL RPC (`book_appointment`):**
   A criação de agendamento é encapsulada em uma Stored Function `SECURITY DEFINER` que executa todas as validações de disponibilidade (jornada, bloqueios, conflitos) e insere o registro de forma estritamente atômica dentro de uma transação.

A validação exclusivamente no aplicativo mobile (frontend) nunca é suficiente e atua apenas como feedback visual; a garantia definitiva reside no banco de dados.

## 7.7 Comportamento quando o horário deixa de estar disponível entre seleção e confirmação

Fluxo esperado:

1. Cliente seleciona horário na tela "Horários disponíveis" (consulta de leitura via PostgREST).
2. Cliente revisa o Resumo.
3. Cliente confirma — chamada à RPC `supabase.rpc('book_appointment', { ... })`.
4. O PostgreSQL executa as validações atômicas de jornada, bloqueio e colisão de horário.
5. Se o horário não estiver mais disponível (ou violar constraint de exclusão): a criação é rejeitada com erro de conflito (`409 Conflict`), e o frontend informa a cliente e retorna à tela de horários com a lista atualizada.
6. Se disponível: agendamento é inserido com `status = 'confirmed'` e retornado ao app.

Não existe "reserva temporária" de horário durante a navegação da cliente (ex.: trava de 5 minutos ao
selecionar) no escopo do MVP — comportamento futuro possível, registrado como `PENDENTE DE DECISÃO`.

## 7.8 Feriados

Suporte a feriados como bloqueio automático não está definido no MVP. Feriados, se necessários, devem ser
registrados manualmente como `blocked_times` pelo admin. Suporte automático a calendário de feriados é
`PENDENTE DE DECISÃO` (fora do MVP).
