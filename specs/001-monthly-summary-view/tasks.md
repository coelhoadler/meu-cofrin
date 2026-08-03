# Tasks: Monthly Summary View for Transactions

**Input**: Design documents from `/specs/001-monthly-summary-view/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Type definitions and base signals initialization

- [ ] T001 Define `VisaoModo` type and `ItemResumoMensal` interface in `src/app/features/lancamentos/lancamentos.component.ts`

---

## Phase 2: User Story 1 - View Monthly Summary Consolidated by Year (Priority: P1) 🎯 MVP

**Goal**: Display a consolidated 12-month summary table (Receitas, Despesas, Saldo) and an annual total row ("Balanço [Ano]") for a selected year.

**Independent Test**: Switch to "Resumo mensal" view and verify all 12 months and annual totals display accurately formatted in pt-BR currency (`R$`).

- [ ] T002 [US1] Add `resumoAno` signal and `resumoConsolidado` computed aggregation signal in `src/app/features/lancamentos/lancamentos.component.ts`
- [ ] T003 [US1] Add year options list (`anosOptions`) and `onResumoAnoChange` handler in `src/app/features/lancamentos/lancamentos.component.ts`
- [ ] T004 [US1] Build Resumo Mensal card container, year dropdown header, and 12-month table template in `src/app/features/lancamentos/lancamentos.component.html`
- [ ] T005 [US1] Render annual total row ("Balanço [Ano]") with green Receitas, red Despesas, and bold Saldo in `src/app/features/lancamentos/lancamentos.component.html`

**Checkpoint**: User Story 1 is functional - 12-month summary and annual totals render correctly for selected year.

---

## Phase 3: User Story 2 - Navigate from Monthly Summary to Detailed List View (Priority: P2)

**Goal**: Allow users to click "Ver" on a specific month row in the summary view to return to the detailed List view filtered by that month and year.

**Independent Test**: Click "Ver" next to "Junho" in the summary table and verify the view switches to "Lista" with the period filter set to 01/06/[Ano] - 30/06/[Ano].

- [ ] T006 [US2] Implement `verMes(mesIndex: number)` navigation and filter handler in `src/app/features/lancamentos/lancamentos.component.ts`
- [ ] T007 [US2] Bind "Ver" action button click handler in summary table rows in `src/app/features/lancamentos/lancamentos.component.html`

**Checkpoint**: User Story 2 is functional - clicking "Ver" transitions view and updates date range filters seamlessly.

---

## Phase 4: User Story 3 - Switch Seamlessly Between List and Resumo Mensal Views (Priority: P3)

**Goal**: Provide a clean toggle button bar ("Lista" | "Resumo mensal") with active visual state styling.

**Independent Test**: Click between "Lista" and "Resumo mensal" buttons and verify visual highlighting and template content switching.

- [ ] T008 [US3] Add `visaoModo` signal state and `setVisaoModo` toggle method in `src/app/features/lancamentos/lancamentos.component.ts`
- [ ] T009 [US3] Render Header view mode toggle buttons ("Lista" | "Resumo mensal") with active state styling in `src/app/features/lancamentos/lancamentos.component.html`

**Checkpoint**: User Story 3 is functional - view mode toggle buttons highlight correctly and toggle page content.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification, mobile layout polish, and final quality checks

- [ ] T010 Run quickstart manual verification scenarios from `quickstart.md`
- [ ] T011 Verify dark mode styling, responsive table wrapping, and pt-BR currency formatting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **User Story 1 (Phase 2)**: Depends on Phase 1 setup.
- **User Story 2 (Phase 3)**: Depends on Phase 2 (summary table must exist).
- **User Story 3 (Phase 4)**: Can proceed alongside Phase 2 & 3.
- **Polish (Phase 5)**: Depends on all user stories being complete.

---

## Implementation Strategy

### MVP Scope
1. Complete Phase 1 (Types & Interfaces)
2. Complete Phase 2 (User Story 1 - Monthly Summary Table)
3. Complete Phase 3 (User Story 2 - "Ver" Month Navigation)
4. Complete Phase 4 (User Story 3 - View Toggle Buttons)
5. Verify against `quickstart.md`
