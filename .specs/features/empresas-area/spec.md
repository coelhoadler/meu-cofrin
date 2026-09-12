# Área para Empresas Specification

## Problem Statement

O aplicativo Meu Cofrin precisa de uma área separada para clientes do segmento "Empresas", com identidade visual distinta (tons de verde) e rotas segregadas (ex: `/empresas/login`). Os dados deste segmento serão armazenados no **Cloud Firestore**, numa coleção dedicada (`companies`), mantendo a consistência tecnológica com o restante do app. As telas de login e cadastro de empresas devem seguir o **mesmo padrão visual** já utilizado no login principal (B2C), incluindo fundo com imagem blur, overlay, card com sombra, animações e tipografia.

## Goals

- [ ] Criar a estrutura de rotas base `/empresas/*` (ex: login, cadastro, dashboard).
- [ ] Aplicar identidade visual baseada no design atual, mas utilizando paleta de cores verde.
- [ ] Armazenar perfis de empresas na coleção `companies` do Cloud Firestore.
- [ ] Utilizar `ngx-mask` para aplicar máscara de CNPJ (`00.000.000/0000-00`) nos campos de input.
- [ ] Replicar o padrão visual do login principal (background blur, overlay, card glassmorphism, micro-animações) nas telas de empresas.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ----------- | -------------- |
| Migração de dados entre coleções do Firestore | O escopo é apenas criar a nova área e a coleção `companies`, não migrar os clientes físicos (B2C) já existentes. |
| Funcionalidades complexas de ERP | O MVP inicial será apenas login, cadastro e dashboard básico. |
| Login com Google ou Biometria para empresas | O login B2B será apenas por E-mail/Senha, sem uso de Google. Pode ser adicionado no futuro. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Autenticação (E-mail/Senha) | Usar Firebase Auth padrão com E-mail (como chave principal) e Senha. | Simples e direto, seguindo o padrão já utilizado no Meu Cofrin. | y |
| Paleta Verde | Será gerada uma variação das variáveis CSS atuais (ex: `--color-primary`), mas em verde (ex: `#16a34a`, `#15803d`). | Mantém consistência estrutural com o design atual. | y |
| Armazenamento | Cloud Firestore, coleção `companies` com subcoleções conforme necessário. | Mantém stack unificada com o restante do app, evitando a complexidade do SQL Connect. | y |
| Máscara de CNPJ | Utilizar `ngx-mask` com padrão `00.000.000/0000-00` nos inputs de CNPJ. | Melhora a UX e garante formatação consistente. O valor limpo (apenas números) será usado para o email sintético e armazenamento. | y |
| Visual das telas | Telas de login e cadastro de empresas devem seguir exatamente o mesmo layout/design do `LoginComponent` B2C: fundo com imagem blur + overlay, card com `rounded-3xl shadow-2xl`, labels com `text-xs font-semibold`, inputs com `rounded-2xl`, botão principal com efeito de loading spinner, versão no rodapé. A diferença será apenas na paleta de cores (verde ao invés de indigo/roxo). | Garante consistência visual entre as áreas do app. | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Acesso e Identidade Visual ⭐ MVP

**User Story**: As a cliente empresa, I want acessar o sistema por uma rota dedicada e ver uma interface com tons verdes so that eu saiba que estou no ambiente corporativo do Meu Cofrin.

**Why P1**: Requisito principal solicitado.

**Acceptance Criteria**:

1. WHEN o usuário acessa `/empresas/login` THEN the system SHALL carregar a tela de login com variáveis CSS em tons de verde e visual idêntico ao login principal (fundo blur, overlay, card glassmorphism).
2. WHEN o usuário acessa `/empresas/dashboard` THEN the system SHALL carregar a área interna com o mesmo layout base, porém em verde.
3. The system SHALL impedir o acesso à rota `/empresas/dashboard` sem autenticação.
4. WHEN o usuário acessa `/empresas/login` THEN the system SHALL exibir o campo de CNPJ com máscara visual `00.000.000/0000-00` via `ngx-mask`.

**Independent Test**: Navegar para `/empresas/login` e `/empresas/dashboard`, verificando visual, rotas e máscara de CNPJ.

---

### P1: Cadastro de Empresa ⭐ MVP

**User Story**: As a cliente empresa, I want me cadastrar usando Nome Fantasia, CNPJ, E-mail e Senha (seguindo a mesma forma do formulário de login do Meu Cofrin), so that eu possa criar minha conta corporativa.

**Why P1**: Requisito essencial para onboarding de empresas, focado na coleta de dados básicos (incluindo E-mail para autenticação).

**Acceptance Criteria**:

1. WHEN o usuário acessa `/empresas/cadastro` THEN the system SHALL exibir um formulário solicitando Nome Fantasia, CNPJ (com máscara `ngx-mask`), E-mail e Senha, com visual consistente com o login principal, sem login via Google.
2. WHEN o formulário for submetido validamente THEN the system SHALL verificar se o E-mail já está em uso; IF já utilizado THEN enviar um alerta dizendo para o usuário utilizar um outro endereço de e-mail.
3. WHEN o E-mail não estiver em uso e os dados forem válidos THEN the system SHALL criar a conta no Firebase Auth com E-mail/Senha e salvar o perfil da empresa (com Nome Fantasia, CNPJ e E-mail) na coleção `companies` do Firestore.
4. IF o CNPJ for inválido THEN the system SHALL exibir mensagem de erro amigável.

**Independent Test**: Preencher o cadastro e verificar se a conta foi criada no Firebase Auth e o documento foi salvo na coleção `companies` do Firestore.

---

### P1: Armazenamento no Firestore ⭐ MVP

**User Story**: As a sistema, I want armazenar os perfis de empresas no Cloud Firestore so that os dados utilizem a mesma stack do restante da aplicação.

**Why P1**: Requisito técnico fundamental para manter a consistência do stack e simplificar a manutenção.

**Acceptance Criteria**:

1. WHEN um usuário empresa faz cadastro THEN the system SHALL criar um documento na coleção `companies` do Firestore contendo no mínimo: `nomeFantasia`, `cnpj`, `email`, `userId` (uid do Firebase Auth), `createdAt`.
2. WHEN um usuário empresa faz login THEN the system SHALL consultar o perfil correspondente na coleção `companies` pelo `userId`.
3. The Firestore security rules SHALL permitir que apenas o próprio usuário autenticado leia/escreva seu documento de empresa.

**Independent Test**: Executar localmente com emuladores (`firebase emulators:start --only firestore,auth`) e verificar a criação e leitura dos documentos na coleção `companies`.

---

## UI/UX Specification

### Padrão Visual (consistente com Login B2C)

As telas de login e cadastro de empresas devem seguir este padrão, já estabelecido no login principal:

| Elemento | Especificação |
| -------- | ------------- |
| Background | Imagem hero com `blur(40px)` + `scale(110%)` + animação `slow-pan` |
| Overlay | `bg-white/85` sobre o fundo |
| Card | `max-w-[420px]`, `rounded-3xl`, `shadow-2xl`, `border border-slate-100`, `p-8` |
| Logo/Header | Logo da empresa ou logo Meu Cofrin Empresas + título + subtítulo |
| Labels | `text-xs font-semibold text-slate-600 ml-1` |
| Inputs | `px-4 py-3`, `rounded-2xl`, `border-slate-200`, focus ring em verde (`focus:ring-green-500/20 focus:border-green-500`) |
| CNPJ Input | Máscara `ngx-mask` com `mask="00.000.000/0000-00"` e `dropSpecialCharacters: true` |
| Botão Principal | `rounded-2xl`, fundo verde (`bg-green-600 hover:bg-green-700`), texto branco, loading spinner |
| Erros | `p-3 rounded-xl bg-red-50 border border-red-100 text-red-600` |
| Versão | `fixed bottom-2 right-2`, mesmo estilo do login B2C |

### Diferenças de cor (Verde vs Indigo/Roxo)

| Contexto | Login B2C | Login B2B (Empresas) |
| -------- | --------- | -------------------- |
| Focus ring | `indigo-500/20` | `green-500/20` |
| Focus border | `indigo-500` | `green-500` |
| Botão principal | `#311B65` | `green-600` / `#16a34a` |
| Botão hover | `#261452` | `green-700` / `#15803d` |
| Links | `text-indigo-600` | `text-green-600` |
| Shadow accent | `indigo-900/10` | `green-900/10` |

---

## Edge Cases

- IF a autenticação falhar na rota `/empresas/login` THEN system SHALL exibir mensagem de erro amigável no card (padrão `bg-red-50`).
- IF o Firestore estiver indisponível THEN system SHALL mostrar erro de sistema e não crashar a UI.
- IF o CNPJ digitado tiver menos de 14 dígitos THEN system SHALL manter o botão de submit desabilitado.
- IF o campo CNPJ perder o foco com valor inválido THEN system SHALL exibir mensagem de validação.

---

## Technical Notes

### ngx-mask

- **Pacote**: `ngx-mask` (compatível com Angular standalone components)
- **Uso**: Importar `NgxMaskDirective` e `provideNgxMask()` no componente/providers
- **Configuração no input**: `mask="00.000.000/0000-00"` com `[dropSpecialCharacters]="true"` para que o `formControl` receba apenas os 14 dígitos
- **Autenticação**: o e-mail informado no formulário será utilizado como chave para o Firebase Auth. Não haverá login via Google, apenas E-mail e Senha. Antes de cadastrar, o sistema fará uma validação se o e-mail já existe na base e exibirá um alerta caso necessário.

### Estrutura Firestore

```
companies/
  {documentId}/
    nomeFantasia: string
    cnpj: string (14 dígitos, sem pontuação)
    email: string
    userId: string (Firebase Auth UID)
    createdAt: Timestamp
```

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----------- | ------ | ------- |
| EMP-01 | P1: Acesso e Identidade Visual | Specify | Pending |
| EMP-02 | P1: Armazenamento no Firestore | Specify | Pending |
| EMP-03 | P1: Cadastro de Empresa | Specify | Pending |
| EMP-04 | P1: ngx-mask no campo CNPJ | Specify | Pending |
| EMP-05 | P1: Visual consistente com Login B2C | Specify | Pending |

**Coverage:** 5 total, 0 mapped to tasks, 5 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] Rota `/empresas/login` e `/empresas/dashboard` funcionais.
- [ ] A cor principal na área de empresas é verde.
- [ ] O visual das telas de login e cadastro é consistente com o login principal (fundo blur, overlay, card, etc.).
- [ ] O campo CNPJ exibe máscara `00.000.000/0000-00` via `ngx-mask` e envia apenas os dígitos.
- [ ] Os perfis de empresa são salvos na coleção `companies` do Firestore.
- [ ] As security rules do Firestore protegem a coleção `companies` corretamente.
