# 05. Fluxos Completos da Cliente

Status: CONFIRMADO.

## 5.1 Mapa geral de telas

```
Splash
  → Login ⇄ Cadastro
       Cadastro → Confirmação de e-mail
  → (autenticado, verificado, role=client)
  → Home
     → Seleção de Profissional
        → Seleção de Serviço
           → Calendário (datas)
              → Horários disponíveis
                 → Resumo
                    → Confirmação
                       → Agendamento concluído
  → Meus Agendamentos
     → Detalhes do Agendamento
        → Cancelar (se permitido)
  → Histórico
  → Perfil
     → Editar Perfil
     → Exclusão de Conta
```

## 5.2 Detalhamento por tela

### Splash

- Objetivo: verificar estado de sessão e direcionar automaticamente.
- Ações: nenhuma interação do usuário.
- Navegação: para Login (sem sessão), Confirmação de e-mail (sessão sem verificação), Home (client
  verificado) ou área administrativa (admin verificado).

### Login

- Objetivo: autenticar qualquer usuário (cliente ou admin) — tela única (ver `03-identidade-roles-autenticacao.md`).
- Entradas: e-mail, senha.
- Validações: formato de e-mail; campos obrigatórios.
- Erros: credenciais inválidas (mensagem genérica), conta desativada (mensagem genérica), erro de rede.
- Ações: "Entrar", "Esqueci minha senha", "Criar conta".

### Cadastro

- Entradas: nome, e-mail, telefone, senha, confirmação de senha.
- Validações: formato de e-mail, telefone, senha e confirmação idênticas, e-mail não previamente cadastrado.
- Sucesso: envia e-mail de confirmação, direciona para tela de Confirmação de e-mail.
- Erros: e-mail já cadastrado, senha fraca (conforme política do provedor), erro de rede.

### Confirmação de e-mail

- Objetivo: informar que a confirmação é obrigatória e permitir reenvio.
- Ações: "Reenviar e-mail de confirmação", "Já confirmei / Continuar" (reconsulta estado), Logout.
- Estado bloqueante: nenhuma outra tela funcional é acessível a partir daqui até confirmação.

### Recuperação de senha

- Entrada: e-mail.
- Sucesso: mensagem genérica confirmando envio (independentemente de o e-mail existir ou não).

### Home (Cliente)

- Objetivo: ponto de entrada para novo agendamento e acesso rápido aos próprios agendamentos.
- Informações exibidas: próximo agendamento (se houver), atalho para "Agendar", atalho para "Meus
  Agendamentos".
- Estado vazio: nenhum agendamento futuro — CTA destacado para novo agendamento.

### Seleção de Profissional

- Lista de profissionais ativos.
- Estado vazio: nenhum profissional ativo (mensagem informativa; cenário operacional excepcional).

### Seleção de Serviço

- Lista de serviços ativos oferecidos pelo profissional selecionado, com duração exibida.
- Estado vazio: profissional sem serviços ativos no momento.

### Calendário (datas)

- Exibe datas futuras disponíveis para o serviço/profissional selecionado.
- Datas sem qualquer horário disponível são desabilitadas ou omitidas (decisão de UI —
  `PENDENTE DE DECISÃO` entre "desabilitar visualmente" e "omitir").

### Horários disponíveis

- Lista apenas horários compatíveis com jornada, bloqueios, duração do serviço e ausência de conflito
  (ver `06-motor-disponibilidade.md`... consolidado em `07-modelo-banco-dados.md` e no domínio próprio).
- Estado vazio: nenhum horário disponível na data selecionada — sugestão de nova data.

### Resumo

- Exibe: profissional, serviço, data, horário, duração, campo de observação opcional.
- Ação: "Confirmar agendamento".

### Confirmação

- Submete a criação do agendamento ao backend.
- Cenário de erro relevante: horário deixou de estar disponível entre seleção e confirmação (ver seção 5.3).

### Agendamento concluído

- Confirmação visual de sucesso, resumo final, atalho para "Meus Agendamentos".

### Meus Agendamentos

- Lista de agendamentos futuros do cliente autenticado (apenas os seus, nunca de terceiros).
- Estado vazio: nenhum agendamento futuro.

### Detalhes do Agendamento (cliente)

- Exibe todos os dados do agendamento próprio.
- Ação condicional: "Cancelar", disponível conforme regra de negócio (ex.: prazo mínimo antes do horário,
  se definido — `PENDENTE DE DECISÃO` quanto ao prazo exato).

### Histórico

- Lista de agendamentos concluídos e cancelados do próprio cliente.

### Perfil

- Exibe nome, e-mail, telefone.
- Ações: editar dados, sair (logout), excluir conta.

### Exclusão de conta

- Fluxo detalhado em `14-privacidade-exclusao-conta.md`.
- Exige confirmação explícita (dupla confirmação ou digitação de confirmação — decisão de UX,
  `PENDENTE DE DECISÃO` quanto ao mecanismo exato de confirmação).

## 5.3 Cenários de erro e exceção (transversais ao fluxo da cliente)

| Cenário | Comportamento esperado |
|---|---|
| Sessão expirada | Redirecionamento para Login, com mensagem informativa. |
| E-mail não verificado ao tentar navegar | Redirecionamento para tela de Confirmação de e-mail. |
| Senha incorreta no login | Mensagem genérica de erro, sem indicar se o e-mail existe. |
| Conta inexistente no login | Mesma mensagem genérica de erro (não diferenciar de senha incorreta). |
| Conta desativada | Mensagem genérica de erro de autenticação. |
| Ausência de horários disponíveis | Estado vazio informativo, sem erro técnico. |
| Conflito de agendamento (horário ocupado entre seleção e confirmação) | Erro específico "horário não está mais disponível", retorno à tela de horários com lista atualizada. |
| Erro de rede | Mensagem de erro de conectividade, opção de tentar novamente, sem perda dos dados já preenchidos na tela atual quando tecnicamente viável. |
| Recurso inexistente (ex.: agendamento excluído por admin) | Mensagem "agendamento não encontrado", retorno à lista. |
| Acesso negado (ex.: tentativa de acessar agendamento de outro cliente via URL/deep link manipulado) | Erro de autorização (403 do backend), tela de acesso negado genérica. |
