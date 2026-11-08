1. Refactor `InvestimentosComponent` to pre-calculate `rentabilidade` inside the `investimentosPorCategoria` computed signal, instead of computing it in the template using the `getRentabilidade` method call.
2. Update the HTML template to use the pre-computed `inv.rentabilidade` instead of `@let rentabilidade = getRentabilidade(inv)`.
3. Remove the unused `getRentabilidade` method from the component class.
4. Complete pre commit steps to ensure proper testing, verifications, reviews, and reflections are done.
5. Create a PR with a title like "⚡ Bolt: [performance improvement] Memoize investment profitability calculation".
