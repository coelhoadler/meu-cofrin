# Implementation Plan: Monthly Summary View for Transactions

**Branch**: `001-monthly-summary-view` | **Date**: 2026-08-03 | **Spec**: [spec.md](file:///c:/Users/adler/OneDrive/Documentos/GitHub/meu-cofrin/specs/001-monthly-summary-view/spec.md)

**Input**: Feature specification from `/specs/001-monthly-summary-view/spec.md`

## Summary

Implement a view mode toggle ("Lista" | "Resumo mensal") on the Lançamentos screen (`/lancamentos`). The new "Resumo mensal" view presents a 12-month consolidated financial summary (Receitas, Despesas, Saldo) for a selected year, with an annual balance total row ("Balanço [Ano]"). Clicking "Ver" on any month row transitions back to the "Lista" view with the date range filter set to that month and year.

## Technical Context

**Language/Version**: TypeScript 5.x / Angular 21 (Zoneless, Signals-first)

**Primary Dependencies**: `@angular/core`, `primeng/select`, `primeng/datepicker`, Tailwind CSS

**Storage**: Firebase Cloud Firestore (`ContaService` fetching transactions via `getContasByAno`)

**Testing**: Vitest (`ng test`)

**Target Platform**: Web application SPA (Responsive desktop & mobile views)

**Project Type**: Single-page Web Application

**Performance Goals**: Instant view switching (< 50ms) using Angular Signals (`computed`), zero extra server round-trips for pre-loaded year datasets.

**Constraints**:
- Must follow Zoneless reactivity using Angular Signals only (`signal`, `computed`, `effect`).
- PrimeNG 21 + Tailwind CSS design system.
- Portuguese (`pt-BR`) currency (`R$`) and month names.

**Scale/Scope**: Single feature component update (`LancamentosComponent`).

## Constitution Check

*GATE: Passed prior to research and design.*

| Principle | Compliance Status | Implementation Detail |
|---|---|---|
| **I. User-Centric Simplicity** | PASS | High-contrast toggle, clean monthly table layout matching prototype, intuitive "Ver" action returning to filtered list. |
| **II. Signals-First & Zoneless** | PASS | Uses `signal` for `visaoModo` & `resumoAno`, and `computed` for 12-month aggregation. Zero legacy Zone.js / RXJS subscriptions. |
| **III. Firebase Suite** | PASS | Integrates existing `ContaService.getContasByAno()` without adding redundant third-party libraries. |
| **IV. PrimeNG & Accessibility** | PASS | Uses PrimeNG `p-select` for year selector, PrimeIcons/Material Symbols for toggle icons, accessible button states. |
| **V. Quality & Testability** | PASS | Formatted via `pt-BR` locale rules, testable signal outputs using Vitest. |

## Project Structure

### Documentation (this feature)

```text
specs/001-monthly-summary-view/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Research findings & decisions
├── data-model.md        # Data models & state flow diagram
├── quickstart.md        # Manual & automated verification guide
├── contracts/
│   └── ui-summary-contract.md # UI state & component interaction contract
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
src/app/
├── core/
│   └── services/
│       └── conta.service.ts          # Financial accounts service
└── features/
    └── lancamentos/
        ├── lancamentos.component.ts   # Component logic (view mode state, summary signals)
        └── lancamentos.component.html # View toggle & template rendering (Lista vs. Resumo)
```

**Structure Decision**: Single component enhancement in `src/app/features/lancamentos/`.

## Proposed Changes

### Component: `LancamentosComponent`

#### [MODIFY] [lancamentos.component.ts](file:///c:/Users/adler/OneDrive/Documentos/GitHub/meu-cofrin/src/app/features/lancamentos/lancamentos.component.ts)
- Add signal `visaoModo = signal<VisaoModo>('lista')` (with persistence or initial state).
- Add signal `resumoAno = signal<number>(new Date().getFullYear())`.
- Add `anosOptions` dropdown options array (e.g., current year ± 5 years).
- Add `computed` signal `resumoConsolidado` to calculate monthly totals for January-December and annual total row (`Balanço [Ano]`).
- Add method `setVisaoModo(modo: VisaoModo)` to toggle view modes and load year data if required.
- Add method `verMes(mesIndex: number)` to transition to `'lista'` view with `dataRangeFiltro` set to that specific month/year.

#### [MODIFY] [lancamentos.component.html](file:///c:/Users/adler/OneDrive/Documentos/GitHub/meu-cofrin/src/app/features/lancamentos/lancamentos.component.html)
- Add view mode toggle buttons (`Lista` | `Resumo mensal`) under the header title.
- Add conditional rendering `@if (visaoModo() === 'lista') { ... } @else { ... }`.
- Build the "Resumo mensal" card container with year filter select dropdown on top-right.
- Render the 12-month summary table with columns: `Mês`, `Receitas`, `Despesas`, `Saldo`, action column with `Ver` button.
- Render bottom total row `Balanço [Ano]` with formatted totals.

## Verification Plan

### Automated Tests
```bash
npm run test -- --grep "LancamentosComponent"
```

### Manual Verification
- Follow [quickstart.md](file:///c:/Users/adler/OneDrive/Documentos/GitHub/meu-cofrin/specs/001-monthly-summary-view/quickstart.md) to verify toggling, year changes, and "Ver" action navigation.

## Complexity Tracking

*No constitution violations or unjustified complexity introduced.*
