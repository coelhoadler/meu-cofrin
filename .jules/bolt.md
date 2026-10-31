## 2026-10-25 - Redundant API Calls in Dashboard Initialization
**Learning:** In `DashboardComponent`, `loadLancamentos` and `loadResumoMes` both independently call `contaService.getContasByMesReferencia(mesRef)`. During initialization (in the `effect`), they are called back-to-back synchronously. The cache in `ContaService` only caches resolved results. Thus, two identical Firestore queries are dispatched simultaneously because the first hasn't finished resolving to populate the cache before the second runs.

**Action:** We can optimize this by implementing a Promise-based cache or request coalescing in `ContaService`. This way, if a second request for the same `mesReferencia` comes in while the first is still in flight, it will return the same Promise, saving a redundant Firestore query.

## 2026-10-30 - Date instantiation inside filter loops
**Learning:** Instantiating `Date` objects inside array operations like `.filter()` creates unnecessary object allocations and slows down array processing, particularly when the boundary dates being evaluated remain constant for the entire loop iteration.
**Action:** Always extract invariant object creations outside the iteration loop, and use numeric comparisons (like `.getTime()`) instead of entire objects when evaluating inequalities (`>=`, `<=`) for optimal speed and memory efficiency.
