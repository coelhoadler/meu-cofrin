# Interface Contract: Monthly Summary View UI Interactions

**Feature**: Monthly Summary View (`specs/001-monthly-summary-view`)
**Date**: 2026-08-03

## Component Contract: `LancamentosComponent`

### State Properties (Signals)

| Property | Type | Initial Value | Description |
|---|---|---|---|
| `visaoModo` | `Signal<VisaoModo>` | `'lista'` | Active view mode ('lista' or 'resumo') |
| `resumoAno` | `Signal<number>` | Current Year | Selected year for the monthly summary table |
| `resumoConsolidado` | `Signal<ResumoAnual>` | `computed(...)` | Computed 12-month summary + annual balance row |

### Event Handlers & Methods

#### 1. `setVisaoModo(modo: VisaoModo): void`
- **Behavior**: Sets `visaoModo.set(modo)`. If switching to `'resumo'`, ensures transactions for `resumoAno` are loaded.

#### 2. `onResumoAnoChange(ano: number): void`
- **Behavior**: Updates `resumoAno.set(ano)` and invokes `carregarDadosPorAno(ano)` to fetch data for the newly selected summary year.

#### 3. `verMes(mesIndex: number): void`
- **Behavior**: 
  - Calculates start date (`new Date(resumoAno(), mesIndex, 1)`) and end date (`new Date(resumoAno(), mesIndex + 1, 0)`).
  - Sets `dataRangeFiltro.set([inicio, fim])`.
  - Sets `visaoModo.set('lista')`.
  - Reloads/filters list view for that specific month and year.

### Template Render Structure

```html
<!-- View Mode Toggle Bar -->
<div class="flex items-center gap-2 mb-6">
  <button (click)="setVisaoModo('lista')" [ngClass]="...">
    <span class="material-symbols-outlined">filter_alt</span> Lista
  </button>
  <button (click)="setVisaoModo('resumo')" [ngClass]="...">
    <span class="material-symbols-outlined">calendar_today</span> Resumo mensal
  </button>
</div>
```
