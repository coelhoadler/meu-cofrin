# Research & Architectural Decisions: Redesign da Gestão de Categorias com Ícones

**Feature**: `002-category-icons-redesign`  
**Date**: 2026-08-13  
**Status**: Completed  

---

## 1. Icon Library Selection & Standard Mapping

### Context & Challenge
O usuário necessita de uma seleção rica de ícones representativos para finanças pessoais (alimentação, moradia, transporte, saúde, lazer, trabalho, assinaturas, compras, etc.), mantendo leveza, consistência visual e alta performance no carregamento de páginas.

### Decision
Utilizar a biblioteca **Material Symbols (Outlined)** (`material-symbols`), que já se encontra instalada e configurada globalmente no projeto (`package.json`).

### Rationale
- **Consistência**: Todos os ícones visíveis nos mockups e no restante da aplicação utilizam a fonte Material Symbols (`<span class="material-symbols-outlined">nome_icone</span>`).
- **Zero Overhead**: Não é necessário adicionar pacotes npm adicionais ou aumentar o bundle size da aplicação.
- **Flexibilidade**: Renderização nativa vetorial através de ligaduras de fonte (`font-variation-settings`), com suporte a temas claro/escuro e redimensionamento via classes CSS do Tailwind.

### Selected Icon Catalog
| Identificador | Rótulo / Significado | Categoria Financeira Comum |
| :--- | :--- | :--- |
| `sell` | Etiqueta / Tag | Geral / Padrão de Fallback |
| `home` | Casa | Moradia / Aluguel / Condomínio |
| `shopping_cart` | Carrinho | Supermercado / Compras |
| `directions_car` | Carro | Transporte / Combustível / Uber |
| `restaurant` | Garfo e Faca | Alimentação / Restaurante / Delivery |
| `favorite` | Coração | Saúde / Farmácia / Cuidados |
| `school` | Chapéu de Formatura | Educação / Cursos / Faculdade |
| `flight` | Avião | Viagens / Turismo |
| `fitness_center` | Haltere | Academia / Esportes |
| `redeem` | Presente | Presentes / Doações |
| `wifi` | Wi-Fi | Internet / Telecomunicações |
| `smartphone` | Celular | Telefonia / Recargas |
| `bolt` | Raio | Luz / Eletricidade |
| `water_drop` | Gota de Água | Água / Saneamento |
| `checkroom` | Cabide / Roupa | Vestuário / Acessórios |
| `pets` | Pata | Animais de Estimação / Veterinário |
| `child_care` | Bebê | Filhos / Berçário / Cuidados |
| `work` | Maleta | Trabalho / Salário / PJ |
| `savings` | Cofrinho | Poupança / Investimentos |
| `credit_card` | Cartão | Cartão de Crédito / Tarifas |
| `account_balance_wallet` | Carteira | Salário / Entradas |
| `movie` | Claquete | Entretenimento / Streaming / Cinema |
| `music_note` | Nota Musical | Música / Shows / Spotify |
| `coffee` | Xícara de Café | Cafeteria / Padaria / Lanches |
| `local_gas_station` | Bomba de Gasolina | Combustível |
| `build` | Chave de Fenda | Manutenção / Ferramentas / Reformas |

---

## 2. Backward Compatibility & Fallback Strategy

### Context & Challenge
Categorias já cadastradas no Firestore possuem o atributo legado `cor` (ex: `"#1a112c"`) e não possuem o campo `icone`. O usuário executará um script posterior para remover o campo `cor`, portanto a aplicação frontend não deve falhar nem exibir ícones quebrados durante a fase de transição.

### Decision
Implementar um **Fallback Padrão** na renderização:
- Se `categoria.icone` existir e for válido, renderiza `categoria.icone`.
- Se `categoria.icone` for nulo, indefinido ou vazio, renderiza o ícone padrão `'sell'`.
- Ao abrir o formulário de edição de uma categoria sem `icone`, o seletor visual virá pré-selecionado com o ícone padrão `'sell'`.

---

## 3. UI/UX Modal & Responsive Card Grid Architecture

### Context & Challenge
A listagem anterior exibia formulário e lista na mesma página de forma empilhada. O novo design separa a listagem em um Grid de Cartões elegante e utiliza uma Modal (Dialog) centralizada para criação e edição, similar ao design moderno do MeuCofrin.

### Decision
- **Listagem Principal**: Grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`) com cartões arredondados (`rounded-2xl`), ícone em destaque com fundo suave `bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300`, nome em negrito e botões discretos de edição (lápis) e exclusão (lixeira).
- **Modal de Criação / Edição**: Componente com backdrop escurecido, fechamento por `Escape`, clique no backdrop ou botão "Cancelar"/"X", foco acessível e animação suave de entrada.
- **Seletor de Ícones**: Container de grade de ícones com altura fixa e rolagem vertical (`max-h-48 overflow-y-auto pr-1 grid grid-cols-6 sm:grid-cols-8 gap-2`), onde cada botão de ícone possui efeito hover e destaque ativo (`ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700`).

---

## 4. State Management & Angular Reactivity

### Context & Challenge
Conforme a Constituição do MeuCofrin (Princípio II: *Signals-First & Zoneless Reactivity*), o estado do componente deve ser 100% gerenciado com Angular Signals e detecção de mudança Zoneless.

### Decision
- Estado do componente utilizando Signals:
  - `categorias = signal<Categoria[]>([])`
  - `isModalOpen = signal<boolean>(false)`
  - `isEditMode = signal<boolean>(false)`
  - `editingId = signal<string | null>(null)`
  - `selectedIcon = signal<string>('sell')`
  - `isLoading = signal<boolean>(false)`
  - `errorMessage = signal<string | null>(null)`
- Formulário reativo mantido para validação de campos (`nome` obrigatório, `descricao` opcional), com sincronização direta do Signal `selectedIcon` na submissão.
