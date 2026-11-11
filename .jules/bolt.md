## 2026-10-25 - Redundant API Calls in Dashboard Initialization
**Learning:** In `DashboardComponent`, `loadLancamentos` and `loadResumoMes` both independently call `contaService.getContasByMesReferencia(mesRef)`. During initialization (in the `effect`), they are called back-to-back synchronously. The cache in `ContaService` only caches resolved results. Thus, two identical Firestore queries are dispatched simultaneously because the first hasn't finished resolving to populate the cache before the second runs.

**Action:** We can optimize this by implementing a Promise-based cache or request coalescing in `ContaService`. This way, if a second request for the same `mesReferencia` comes in while the first is still in flight, it will return the same Promise, saving a redundant Firestore query.

## 2026-11-11 - View Model pattern for Angular Templates
**Learning:** Using template method calls like `getRowClass(item)` in `@for` loops causes severe performance bottlenecks because they run on every change detection cycle, creating many redundant objects like `new Date()`.
**Action:** Instead of calling methods in the template, map source signals (like `lancamentos`) to derived view model signals using `computed()` that precalculate necessary values (like row classes or formatted dates).
