# 🤖 Diretrizes para Agentes de IA - Meu Cofrin

Este documento define regras, convenções arquiteturais e padrões de desenvolvimento que todo agente de IA deve seguir ao trabalhar no repositório **Meu Cofrin**.

---

## 📌 Visão Geral do Projeto

- **Nome**: Meu Cofrin ([meu-cofrin.app.br](https://meu-cofrin.app.br))
- **Objetivo**: Aplicação web moderna, PWA e responsiva para gestão financeira pessoal (lançamentos de receitas/despesas, categorização, gestão de investimentos, replicação de contas recorrentes e gráficos de acompanhamento).
- **Idioma Principal**: Português do Brasil (`pt-BR`). Toda a interface com o usuário, labels, formatações e mensagens do produto devem ser em português brasileiro.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend Framework** | Angular (v22+), Zoneless (`provideZonelessChangeDetection()`), Standalone Components |
| **Reatividade & Estado** | Signals (`signal`, `computed`, `effect`, `resource`, `linkedSignal`) |
| **Estilização & UI** | Tailwind CSS (v4), PrimeNG (v21, tema Aura com `.dark`), PrimeIcons, Material Symbols |
| **Formulários & Máscaras** | Angular Forms (Signal/Reactive), `ngx-mask`, `ngx-currency`, `ngx-toastr` |
| **Gráficos** | Chart.js, `ng2-charts` |
| **Backend & Banco de Dados** | Firebase Suite (`@angular/fire`, Firebase Web SDK 12+): Authentication, Cloud Firestore, Cloud Storage, Cloud Messaging, Analytics, Performance |
| **Backend Assíncrono** | Firebase Cloud Functions (`functions/`, Node 22, TypeScript, `@simplewebauthn/server`, Postmark) |
| **Renderização & PWA** | SSR (`@angular/ssr`, Express server em `src/server.ts`), Service Worker (`ngsw-config.json`) |
| **Testes** | Vitest (`npm test` via `@angular/build:unit-test`), Playwright (`npm run e2e`) |
| **Observabilidade** | Sentry (`@sentry/angular`) |

---

## 📐 Padrões Arquiteturais e Regras de Código

### 1. Angular & Reatividade (Signals-First & Zoneless)
- **Obrigatório Signals**: Todo gerenciamento de estado reativo deve usar Angular Signals (`signal`, `computed`, `effect`, `linkedSignal`).
- **Zoneless**: O projeto roda com `provideZonelessChangeDetection()`. **NUNCA** introduza ou dependa de `zone.js`.
- **Standalone Only**: Todos os componentes, diretivas e pipes são `standalone: true`. **NÃO** crie módulos `@NgModule`.
- **Injeção com `inject()`**: Prefira a função `inject(Service)` ao invés de injeção tradicional no construtor.
- **Controle de Fluxo no Template**: Utilizar a sintaxe moderna de controle de fluxo (`@if`, `@for (item of items; track item.id)`, `@switch`).

### 2. Estrutura de Diretórios
- `src/app/core/`: Serviços singleton (`providedIn: 'root'`), guards de autenticação, interceptors, modelos de dados globais e layout base.
- `src/app/features/`: Componentes organizados por domínio de negócio (`dashboard`, `lancamentos`, `categorias`, `investimentos`, `perfil`, `login`, `empresas`, etc.).
- `functions/`: Cloud Functions em TypeScript (triggers de banco, envio de e-mails via Postmark, autenticação biométrica WebAuthn).
- `public/`: Arquivos estáticos, ícones e assets públicos.

### 3. Firebase & Firestore
- **Isolamento por Usuário**: Garantir que consultas e gravações respeitem o `userId` do usuário autenticado.
- **Otimização de Leituras e Caching**: Evite queries redundantes ao Firestore; aproveite as estratégias de caching em memória existentes nos serviços (ex: `ContaService.invalidateCache()`).
- **Timestamps**: Utilize `serverTimestamp()` do `@angular/fire/firestore` para campos de auditoria (`createdAt`, `updatedAt`).
- **Tratamento de Exceções**: Sempre tratar erros assíncronos do Firebase com mensagens empáticas e amigáveis para o usuário via `ngx-toastr` ou feedbacks visuais.

### 4. Interface, Design & UX Financeira
- **Localização pt-BR**: Moeda sempre formatada em Real brasileiro (`R$ 1.234,56`), datas em `dd/MM/yyyy`.
- **Privacidade (Ocultar Valores)**: Respeite o sinal `showValues`. Quando o usuário optar por ocultar valores, exiba `••••`.
- **Responsividade & Mobile-First**: O app é amplamente utilizado em dispositivos móveis. Cards, resumos e tabelas nunca devem quebrar a largura ou causar overflow horizontal indesejado.
- **Dark Mode**: Suporte a tema claro/escuro via seletor `.dark`. Assegure contraste e compatibilidade com o preset Aura do PrimeNG e utilitários do Tailwind.

---

## 🧪 Testes, Qualidade e Validação

- **Testes Unitários**: Vitest (`npm test` ou `ng test`). Ao criar ou refatorar serviços e componentes, adicione ou atualize os testes `.spec.ts`.
- **Testes E2E Automatizados**: Playwright (`npm run e2e`).
- **Validação com Playwright MCP (Obrigatório para Front-end)**:
  - **Quando aplicar**: Sempre que houver qualquer alteração no front-end (templates HTML, estilos Tailwind/CSS, componentes visuais, formulários, diálogos ou rotas).
  - **Fluxo de validação**:
    1. Certificar-se de que a aplicação está rodando localmente (`npm start` em `http://localhost:4200`).
    2. Usar o **Playwright MCP** para navegar até a página ou rota afetada pela alteração.
    3. Testar os fluxos e interações principais (cliques de botões, inputs, submissão de formulários, abertura de modais ou filtros).
    4. Verificar se há erros ou exceções no console do navegador (`console.error`).
    5. Validar a renderização visual: responsividade (mobile e desktop), integridade com o Dark Mode (`.dark`) e comportamento da máscara de privacidade (`showValues`).
- **Verificação pós-código**: Após alterações em código Angular ou TypeScript, rode `npm run build` ou `npm test` para assegurar que não há erros de compilação ou regressões.

---

## 📝 Convenção de Commits (Conventional Commits)

O repositório utiliza **Commitlint** e **Husky** com `@commitlint/config-conventional`. Todo commit DEVE seguir o formato:

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração de código sem mudança funcional
- `chore:` Tarefas de manutenção, dependências ou build
- `docs:` Documentação
- `test:` Adição ou ajuste de testes
- `perf:` Melhoria de performance
- `style:` Ajustes de formatação/estilização que não afetam lógica

*Exemplo:* `feat(lancamentos): adicionar filtro por categoria`

---

## 🚀 Comandos Mais Utilizados

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor local Angular (`ng serve`) |
| `npm run build` | Executa o build de produção com SSR |
| `npm test` | Roda a suíte de testes unitários com Vitest |
| `npm run e2e` | Executa os testes de ponta a ponta com Playwright |
| `npm run deploy` | Realiza o build de produção e deploy no Firebase |
| `cd functions && npm run build` | Compila o TypeScript das Cloud Functions |

---

## 💡 Regras de Ouro para o Agente de IA

1. **Nunca quebre o Zoneless**: Não importe `zone.js` nem pacotes legados incompatíveis.
2. **Priorize Português (pt-BR)** nas respostas, mensagens de commit, comentários relevantes e textos da UI.
3. **Mantenha consistência de código**: Siga o padrão de arquivos irmãos (`.component.ts` + `.component.html`) e injeção com `inject()`.
4. **Validação de Front-end com Playwright MCP**: Qualquer alteração de interface (templates, CSS/Tailwind, formulários, componentes visuais) DEVE ser validada ativamente no navegador via ferramentas do Playwright MCP antes de concluir a tarefa.
5. **Valide a integridade do build**: Antes de concluir tarefas de refatoração ou adição de features, certifique-se de que o código compila corretamente.