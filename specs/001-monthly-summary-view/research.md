# Research & Technical Decisions: Monthly Summary View

**Feature**: Monthly Summary View (`specs/001-monthly-summary-view`)
**Date**: 2026-08-03

## Research Questions & Decisions

### 1. View Mode Management & Navigation
- **Question**: How should the application manage state switching between "Lista" and "Resumo mensal" views, and preserve selected filters when returning from summary to list?
- **Decision**: Introduce a `visao = signal<'lista' | 'resumo'>('lista')` in `LancamentosComponent`. When a user clicks "Ver" on a specific month (e.g., month index 5 for Junho in year 2026), the `verMes(mesIndex: number)` handler will:
  1. Calculate the start date (`new Date(ano, mesIndex, 1)`) and end date (`new Date(ano, mesIndex + 1, 0)`).
  2. Set `dataRangeFiltro.set([inicio, fim])`.
  3. Set `visao.set('lista')`.
  4. Trigger `carregarDados()` if the selected year differs from currently loaded data.
- **Rationale**: Keeps state management fully reactive with Angular Signals without adding extra route parameters or complex router guards.

### 2. Monthly Summary Aggregation Strategy
- **Question**: How should the 12-month summary data (Receitas, Despesas, Saldo) be calculated efficiently?
- **Decision**: Define a `resumoMensalAno = signal<number>(new Date().getFullYear())` for the summary view year dropdown filter, and a computed signal `resumoMensalDados = computed(() => ...)`:
  - Generate an array for all 12 months (Janeiro to Dezembro).
  - For each month index `0..11`, iterate over `contas()` matching `mesReferencia === `${resumoAno}-${String(mesIndex + 1).padStart(2, '0')}`.
  - Calculate `totalReceitas`, `totalDespesas`, and `saldo = totalReceitas - totalDespesas`.
  - Calculate the bottom row `balancoAnual` as the sum of all 12 months.
- **Rationale**: Signals provide zero-cost memoization and update instantly whenever `contas()` or `resumoMensalAno()` updates.

### 3. Year Dropdown Selection Options
- **Question**: Where should the available year list for the summary view come from?
- **Decision**: Provide options from current year minus 5 to current year plus 2, plus dynamically including any unique years present in the loaded dataset.
- **Rationale**: Ensures the user can select recent, current, and near-future years even before creating transactions in those years.

### 4. UI/UX Consistency & Styling
- **Question**: How to align the UI with the prototype and project constitution?
- **Decision**:
  - Main header toggle bar with options `Lista` (icon `filter_alt`) and `Resumo mensal` (icon `calendar_today`).
  - Active button highlighted with background (`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white shadow-sm`).
  - Summary card uses PrimeNG `p-select` for year selection in top-right.
  - Receitas text styled with `text-emerald-600 dark:text-emerald-400`, Despesas with `text-rose-600 dark:text-rose-400`, Saldo with `text-slate-900 dark:text-white font-bold`.
  - Bottom row highlighted with a subtle background (`bg-slate-50 dark:bg-slate-800/60 font-bold`).
- **Rationale**: Follows PrimeNG + Tailwind CSS styling rules and exact prototype aesthetics provided by user.
