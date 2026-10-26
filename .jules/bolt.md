## 2026-10-25 - Redundant API Calls in Dashboard Initialization
**Learning:** In `DashboardComponent`, `loadLancamentos` and `loadResumoMes` both independently call `contaService.getContasByMesReferencia(mesRef)`. During initialization (in the `effect`), they are called back-to-back synchronously. The cache in `ContaService` only caches resolved results. Thus, two identical Firestore queries are dispatched simultaneously because the first hasn't finished resolving to populate the cache before the second runs.

**Action:** We can optimize this by implementing a Promise-based cache or request coalescing in `ContaService`. This way, if a second request for the same `mesReferencia` comes in while the first is still in flight, it will return the same Promise, saving a redundant Firestore query.

## 2026-10-26 - Missing request coalescing for `getContasByAno`
**Learning:** Similar to `getContasByMesReferencia`, `getContasByAno` can be called repeatedly and concurrently from component initializations. Since the cache was only for resolved queries, concurrent requests would trigger redundant Firestore API calls, reducing performance.

**Action:** Implemented request coalescing in `getContasByAno` inside `ContaService` using a Map to store in-flight promises. Any subsequent calls with the same arguments before the promise resolves will receive the in-flight promise.
