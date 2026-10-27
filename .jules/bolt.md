## 2026-10-25 - Redundant API Calls in Dashboard Initialization
**Learning:** In `DashboardComponent`, `loadLancamentos` and `loadResumoMes` both independently call `contaService.getContasByMesReferencia(mesRef)`. During initialization (in the `effect`), they are called back-to-back synchronously. The cache in `ContaService` only caches resolved results. Thus, two identical Firestore queries are dispatched simultaneously because the first hasn't finished resolving to populate the cache before the second runs.

**Action:** We can optimize this by implementing a Promise-based cache or request coalescing in `ContaService`. This way, if a second request for the same `mesReferencia` comes in while the first is still in flight, it will return the same Promise, saving a redundant Firestore query.

## 2026-10-25 - N+1 Writes in Firestore Collections
**Learning:** Performing multiple independent Firestore inserts (like replicating recurring bills across months) using an array of `Promise.all([addDoc(...), addDoc(...)])` triggers N separate network requests. This introduces unnecessary latency and degrades performance for the end user when dealing with multiple documents, essentially an N+1 writes problem.

**Action:** Whenever iterating to write or update multiple Firestore documents simultaneously, avoid `Promise.all` mapping. Instead, use Firestore's `writeBatch` (or batched endpoints if calling a backend API) to bundle operations into a single network round-trip. This ensures atomicity and dramatically reduces latency.
