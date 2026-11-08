## 2026-10-25 - Redundant API Calls in Dashboard Initialization
**Learning:** In `DashboardComponent`, `loadLancamentos` and `loadResumoMes` both independently call `contaService.getContasByMesReferencia(mesRef)`. During initialization (in the `effect`), they are called back-to-back synchronously. The cache in `ContaService` only caches resolved results. Thus, two identical Firestore queries are dispatched simultaneously because the first hasn't finished resolving to populate the cache before the second runs.

**Action:** We can optimize this by implementing a Promise-based cache or request coalescing in `ContaService`. This way, if a second request for the same `mesReferencia` comes in while the first is still in flight, it will return the same Promise, saving a redundant Firestore query.

## 2024-11-08 - [Angular Template Method Optimization]
**Learning:** Calling methods (like `getRentabilidade(inv)`) inside Angular templates (e.g., inside `@for` loops) causes the function to be evaluated repeatedly on every change detection cycle, degrading performance.
**Action:** Always pre-calculate derived values (memoization) within the component class (e.g., inside a `computed` signal) instead of evaluating them in the HTML template.
