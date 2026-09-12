# Sessão Expirada e Temporizador Specification

## Problem Statement

Atualmente, o Meu Cofrin possui um tempo limite de sessão de 1 hora baseado no `auth_time` do Firebase Auth, porém o usuário não recebe nenhuma explicação visual de quando ou por que sua sessão expirou, sendo deslogado silenciosamente ou redirecionado sem clareza. Além disso, o usuário não tem visibilidade do tempo restante de sua sessão nem da proximidade do encerramento.

## Goals

- [ ] Exibir o tempo restante e barra de progresso no sub-menu (ao lado da foto do usuário) nos layouts pessoal e corporativo.
- [ ] Centralizar a duração da sessão em variável facilmente configurável (`SESSION_DURATION_MINUTES = 60`).
- [ ] Exibir um modal global bloqueador informando que a sessão se encontra expirada com botão de redirecionamento para login.
- [ ] Garantir que refresh ou abertura do app em rotas protegidas com sessão expirada exiba o modal sobre a tela bloqueada.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Renovação silenciosa infinita por clique | A política de segurança acordada mantém sessão fixa a partir da autenticação |
| Alteração de regras no Firebase Auth backend | A expiração é regida pela política de cliente do Meu Cofrin via `auth_time` |
| Personalização da duração por usuário individual | A duração é uma constante global da aplicação (`session.config.ts`) |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Posicionamento da barra de progresso e tempo | Ao lado direito da foto do usuário no sub-menu, logo abaixo do nome | Decisão explícita do usuário para integrar harmoniosamente aos layouts existentes | Sim |
| Comportamento ao esgotar o tempo | Modal global bloqueador com botão 'Fazer novo login' que desloga e redireciona | Garante clareza e transparência para o usuário sem expulsão silenciosa | Sim |
| Rota de redirecionamento do modal | Direciona para `/login` (área pessoal) ou `/empresas/login` (área corporativa) | Mantém a segregação estrita entre B2C e B2B já estabelecida | Sim |
| Renovação de sessão | Sessão com tempo fixo a partir do login, sem extensão automática | Definido pelo usuário para exigir reautenticação periódica segura | Sim |
| Localização da variável de duração | `src/app/core/auth/session.config.ts` exportando `SESSION_DURATION_MINUTES = 60` | Facilita ajustes rápidos sem poluir arquivos extensos | Sim |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Exibição do Tempo Restante e Barra de Progresso no Sub-menu ⭐ MVP

**User Story**: Como um usuário autenticado (pessoal ou corporativo), quero visualizar os minutos restantes e o progresso da minha sessão ao lado da minha foto no sub-menu, para que eu possa acompanhar quanto tempo ainda tenho antes da expiração.

**Why P1**: Fornece previsibilidade essencial ao usuário sobre sua sessão ativa diretamente na navegação.

**Acceptance Criteria**:

1. WHILE a sessão do usuário estiver válida, the layout pessoal SHALL exibir os minutos restantes e uma barra de progresso logo abaixo do nome do usuário na barra lateral.
2. WHILE a sessão da empresa estiver válida, the layout corporativo SHALL exibir os minutos restantes e uma barra de progresso logo abaixo do nome da empresa na barra lateral.
3. WHEN a barra lateral desktop estiver recolhida, the sistema SHALL ocultar ou compactar o texto de tempo restante mantendo a integridade visual do menu.
4. The sistema SHALL calcular a porcentagem e o tempo restante baseando-se na constante `SESSION_DURATION_MINUTES` e no `auth_time` do token.

**Independent Test**: Fazer login e verificar que a barra lateral exibe o tempo (ex: `59m restantes`) e a barra de progresso preenchida proporcionalmente.

---

### P1: Modal Bloqueador de Sessão Expirada ⭐ MVP

**User Story**: Como um usuário cuja sessão expirou, quero ver um modal claro explicando que a sessão foi encerrada, com um botão que me direcione para o login, para que eu entenda o motivo do encerramento sem ser surpreendido.

**Why P1**: Elimina a expulsão silenciosa e informa com clareza o motivo da desconexão.

**Acceptance Criteria**:

1. WHEN a contagem regressiva da sessão chegar a zero em tempo real, the sistema SHALL exibir imediatamente um modal bloqueador informando que a sessão expirou.
2. WHEN o usuário abrir ou recarregar uma rota protegida já com a sessão expirada, the sistema SHALL renderizar a página sob overlay escuro e exibir o modal de sessão expirada.
3. WHEN o usuário clicar no botão 'Fazer novo login' do modal em rota pessoal, the sistema SHALL realizar o logout e redirecionar para `/login`.
4. WHEN o usuário clicar no botão 'Fazer novo login' do modal em rota corporativa, the sistema SHALL realizar o logout e redirecionar para `/empresas/login`.
5. IF o usuário tentar fechar o modal ou clicar fora do diálogo, THEN the sistema SHALL manter o modal bloqueador aberto e impedir o fechamento.

**Independent Test**: Configurar o tempo para 1 minuto (ou simular `auth_time` passado), verificar que o modal bloqueador aparece e que clicar em 'Fazer novo login' redireciona para `/login` (ou `/empresas/login`).

---

### P2: Sincronização em Mudança de Aba e Foco

**User Story**: Como um usuário que alterna entre abas do navegador, quero que o aplicativo verifique o tempo de sessão ao retornar à aba, para que o status e o modal reflitam o tempo real decorrido enquanto a aba esteve em segundo plano.

**Why P2**: Previne inconsistências causadas por navegadores que suspendem temporizadores de background.

**Acceptance Criteria**:

1. WHEN o documento mudar o estado de visibilidade para 'visible' ou a janela receber foco, the sistema SHALL recalcular imediatamente o tempo restante da sessão.
2. IF o tempo recalculado indicar que o limite configurado foi ultrapassado enquanto a aba esteve inativa, THEN the sistema SHALL exibir o modal de sessão expirada imediatamente.

**Independent Test**: Deixar a aba em background e, após o término do período, reativar o foco; o modal deve ser disparado no instante do foco.

---

## Edge Cases

- IF o token do Firebase não possuir a claim `auth_time`, THEN the sistema SHALL assumir o timestamp atual da inicialização da sessão para evitar expiração prematura.
- IF o usuário estiver em rotas públicas como `/login`, `/empresas/login` ou `/empresas/cadastro`, THEN the sistema SHALL não exibir contadores nem disparar modal de sessão expirada.
- WHEN a rede cair enquanto o modal de sessão expirada estiver aberto, the sistema SHALL permitir que o logout local e o redirecionamento para o login ocorram normalmente.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SESS-01 | P1: Exibição do Tempo Restante e Barra de Progresso no Sub-menu | Execute | Verified |
| SESS-02 | P1: Modal Bloqueador de Sessão Expirada | Execute | Verified |
| SESS-03 | P2: Sincronização em Mudança de Aba e Foco | Execute | Verified |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [x] O usuário consegue ver claramente na barra lateral os minutos restantes e a barra de progresso da sessão.
- [x] Ao atingir o limite ou dar refresh com sessão expirada, um modal visualmente polido é apresentado sem desconexões silenciosas.
- [x] O botão do modal direciona corretamente para a tela de login adequada (`/login` ou `/empresas/login`).
- [x] A duração da sessão é ajustada com uma única alteração no arquivo `src/app/core/auth/session.config.ts`.
