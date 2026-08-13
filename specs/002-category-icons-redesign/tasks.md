# Tasks: Redesign da Gestão de Categorias com Ícones

**Input**: Design documents from `/specs/002-category-icons-redesign/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/category-ui.contract.md](./contracts/category-ui.contract.md), [quickstart.md](./quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Definição de constantes e catálogo de ícones do Material Symbols

- [X] T001 Define and export `CATEGORIA_ICONS` catalog constant in `src/app/core/services/categoria.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Atualização dos tipos e métodos de persistência no Firestore no serviço central de categorias

**⚠️ CRITICAL**: Must complete before implementing User Stories

- [X] T002 Update `Categoria` interface with optional `icone?: string` and legacy `cor?: string` in `src/app/core/services/categoria.service.ts`
- [X] T003 [P] Update `addCategoria` and `updateCategoria` methods in `src/app/core/services/categoria.service.ts` to persist `icone` without requiring `cor`

**Checkpoint**: Foundation ready - CategoriaService and types are prepared.

---

## Phase 3: User Story 1 - Visualização e Listagem de Categorias com Ícone Visual (Priority: P1) 🎯 MVP

**Goal**: Exibir a lista de categorias em cartões modernos com ícone à esquerda, nome e fallback automático para o ícone padrão (`sell`) em categorias legadas.

**Independent Test**: Acessar `/categorias` e verificar a renderização dos cartões de categoria com ícones, fallback de etiqueta em itens legados e ações de editar/excluir.

### Tests for User Story 1
- [X] T004 [P] [US1] Unit test for category card list rendering and icon fallback in `src/app/features/categorias/categorias.component.spec.ts`

### Implementation for User Story 1
- [X] T005 [US1] Implement new page header with "Voltar" link, title, subtitle, and "+ Nova categoria" button in `src/app/features/categorias/categorias.component.html`
- [X] T006 [US1] Implement responsive category card grid with icon badge container, name, and action buttons in `src/app/features/categorias/categorias.component.html` and `src/app/features/categorias/categorias.component.ts`
- [X] T007 [US1] Implement empty state visual card when no categories exist in `src/app/features/categorias/categorias.component.html`

**Checkpoint**: User Story 1 is functional and can be tested independently.

---

## Phase 4: User Story 2 - Cadastro de Nova Categoria com Seletor de Ícones em Modal (Priority: P1)

**Goal**: Abrir modal ao clicar em "+ Nova categoria", permitindo informar nome, descrição e escolher um ícone na grade visual de ícones com persistência no Firestore.

**Independent Test**: Clicar em "+ Nova categoria", preencher o nome, selecionar um ícone na grade e salvar. A modal fecha e a nova categoria aparece na lista com o ícone escolhido.

### Tests for User Story 2
- [X] T008 [P] [US2] Unit test for category creation flow with icon selection in `src/app/features/categorias/categorias.component.spec.ts`

### Implementation for User Story 2
- [X] T009 [US2] Implement modal state signals (`isModalOpen`, `selectedIcon`, `isLoading`, `errorMessage`) and methods in `src/app/features/categorias/categorias.component.ts`
- [X] T010 [US2] Build modal dialog layout with backdrop, close button, Nome/Descrição inputs, and scrollable icon selector grid in `src/app/features/categorias/categorias.component.html`
- [X] T011 [US2] Implement `onSubmit` creation handler in `src/app/features/categorias/categorias.component.ts` saving `icone` and resetting form/modal state

**Checkpoint**: User Story 2 is functional and can be tested independently.

---

## Phase 5: User Story 3 - Edição de Categoria com Troca de Ícone em Modal (Priority: P2)

**Goal**: Permitir a edição de nome, descrição e alteração do ícone de uma categoria existente através da modal reutilizável.

**Independent Test**: Clicar no botão de edição em um cartão de categoria, verificar se a modal abre preenchida com o ícone atual selecionado, alterar o ícone/nome e salvar.

### Tests for User Story 3
- [X] T012 [P] [US3] Unit test for category edition flow and icon update in `src/app/features/categorias/categorias.component.spec.ts`

### Implementation for User Story 3
- [X] T013 [US3] Implement `editCategoria(categoria)` in `src/app/features/categorias/categorias.component.ts` to populate form and preselect current icon (`icone || 'sell'`)
- [X] T014 [US3] Update `onSubmit` logic in `src/app/features/categorias/categorias.component.ts` to call `updateCategoria` when in edit mode

**Checkpoint**: User Story 3 is functional and can be tested independently.

---

## Phase 6: User Story 4 - Exclusão de Categoria com Confirmação (Priority: P3)

**Goal**: Excluir uma categoria após confirmação prévia do usuário.

**Independent Test**: Clicar no botão de lixeira de um cartão de categoria, confirmar a exclusão e verificar a remoção imediata da categoria da listagem.

### Tests for User Story 4
- [X] T015 [P] [US4] Unit test for category deletion in `src/app/features/categorias/categorias.component.spec.ts`

### Implementation for User Story 4
- [X] T016 [US4] Implement delete confirmation dialog and execution in `src/app/features/categorias/categorias.component.ts` and `src/app/features/categorias/categorias.component.html`

**Checkpoint**: User Story 4 is functional and can be tested independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Remoção definitiva de código legado, testes finais e validação de build

- [X] T017 [P] Clean up all obsolete color picker inputs, styles, and unused imports across `src/app/features/categorias/`
- [X] T018 Run automated test suite with `npm test` and verify production build with `npm run build`
- [X] T019 Execute manual verification scenarios from `specs/002-category-icons-redesign/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all User Stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 - Foundation ready.
- **User Story 2 (Phase 4)**: Depends on Phase 2 & Phase 3 (shares modal and list state).
- **User Story 3 (Phase 5)**: Depends on Phase 4 (reuses modal dialog).
- **User Story 4 (Phase 6)**: Depends on Phase 3 (card action buttons).
- **Polish (Phase 7)**: Depends on all User Stories completion.

### Parallel Opportunities

- T003 can run in parallel with T002.
- Unit tests (T004, T008, T012, T015) can run in parallel with each corresponding story.
- T017 cleanup can proceed alongside test verification.

---

## Implementation Strategy

### MVP First (Phase 1 to Phase 3)
1. Complete Setup & Foundational updates on `categoria.service.ts`.
2. Implement User Story 1 (Card list + Icon display + Fallback).
3. Validate list rendering with existing categories.

### Incremental Delivery (User Stories 2, 3, 4 & Polish)
1. Implement User Story 2 (Modal + Icon Selector + Creation).
2. Implement User Story 3 (Edition flow with icon preselection).
3. Implement User Story 4 (Deletion).
4. Remove legacy color picker code and run full test suites.
