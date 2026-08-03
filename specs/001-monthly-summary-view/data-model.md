# Data Model: Monthly Summary View

**Feature**: Monthly Summary View (`specs/001-monthly-summary-view`)
**Date**: 2026-08-03

## Models & Interfaces

### 1. ItemResumoMensal
Represents the aggregated financial total for a single calendar month.

```typescript
export interface ItemResumoMensal {
  mesIndex: number;       // 0 = Janeiro, 11 = Dezembro
  mesNome: string;        // "Janeiro", "Fevereiro", ..., "Dezembro"
  ano: number;            // e.g. 2026
  receitas: number;       // Total sum of Receita entries in the month
  despesas: number;       // Total sum of Despesa entries in the month
  saldo: number;          // receitas - despesas
}
```

### 2. ResumoAnual
Represents the complete annual consolidation including all 12 months and total totals.

```typescript
export interface ResumoAnual {
  ano: number;
  meses: ItemResumoMensal[];
  totalReceitas: number;  // Sum of all 12 months receitas
  totalDespesas: number;  // Sum of all 12 months despesas
  saldoTotal: number;     // totalReceitas - totalDespesas
}
```

### 3. VisaoModo
Type definition for active view state in `LancamentosComponent`.

```typescript
export type VisaoModo = 'lista' | 'resumo';
```

## State & Data Flow Diagram

```mermaid
flowchart TD
    User([User]) -->|Click 'Resumo mensal' toggle| SetVisao[visao.set('resumo')]
    User -->|Select Year in Header Dropdown| SetResumoAno[resumoAno.set(2026)]
    SetResumoAno --> FetchContas[carregarDadosPorAno(2026)]
    FetchContas -->|Update signal| ContasSignal[contas.set(data)]
    ContasSignal --> ComputedResumo[computed: resumoConsolidado]
    ComputedResumo --> RenderTable[Render 12-Month Summary Table + Balanço Anual]
    
    User -->|Click 'Ver' on Month index M| VerHandler[verMes(M, ano)]
    VerHandler --> CalculateRange[Date Range: 01/M/ano to LastDay/M/ano]
    CalculateRange --> SetRange[dataRangeFiltro.set([inicio, fim])]
    SetRange --> SwitchToList[visao.set('lista')]
    SwitchToList --> RenderList[Render Filtered Transaction List]
```
