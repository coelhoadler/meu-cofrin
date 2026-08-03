# Quickstart & Manual Verification: Monthly Summary View

**Feature**: Monthly Summary View (`specs/001-monthly-summary-view`)
**Date**: 2026-08-03

## Manual Verification Steps

### Scenario 1: Toggle Between Lista and Resumo Mensal
1. Open the application and navigate to `/lancamentos`.
2. Observe the view toggle buttons at the top ("Lista" | "Resumo mensal").
3. Verify "Lista" is selected by default and displays the filters card, summary cards, and results list.
4. Click on "Resumo mensal".
5. Verify the screen switches to the "Resumo mensal" card displaying a table with 12 months (Janeiro to Dezembro), columns (Mês, Receitas, Despesas, Saldo, Action), and an annual summary row ("Balanço [Ano]").

### Scenario 2: Year Filtering in Summary View
1. In the "Resumo mensal" view, click the "Ano" dropdown filter at the top right of the card.
2. Select a different year (e.g. 2025 or 2026).
3. Verify that the table updates with monthly values for the selected year and the bottom row changes to `Balanço [SelectedYear]`.

### Scenario 3: "Ver" Action Navigation to List View
1. Locate any month row (e.g., "Junho").
2. Click the "Ver" button on the right side of the row.
3. Verify that:
   - The view mode switches automatically back to "Lista".
   - The "Período" date range filter in "Lista" view is populated with `01/06/[Ano]` to `30/06/[Ano]`.
   - The list results display only transactions within that selected month and year.

## Automated Verification

Run unit tests via Vitest:

```bash
npm run test -- --grep "LancamentosComponent"
```
