# UI & Service Contract: Gestão de Categorias com Ícones

**Feature**: `002-category-icons-redesign`  
**Date**: 2026-08-13  
**Status**: Completed  

---

## 1. CategoriaService Contract

```typescript
export interface ICategoriaService {
  /**
   * Adiciona uma nova categoria no Firestore
   * @param categoria Dados da categoria contendo 'icone' e omitindo 'cor'
   */
  addCategoria(categoria: Omit<Categoria, 'id' | 'createdAt'>): Promise<void>;

  /**
   * Recupera todas as categorias do usuário autenticado ordenadas alfabeticamente ou por tipo
   */
  getCategorias(): Promise<Categoria[]>;

  /**
   * Atualiza uma categoria existente pelo ID
   * @param id ID do documento no Firestore
   * @param categoria Dados parciais a atualizar
   */
  updateCategoria(id: string, categoria: Partial<Categoria>): Promise<void>;

  /**
   * Exclui uma categoria do Firestore
   * @param id ID do documento no Firestore
   */
  deleteCategoria(id: string): Promise<void>;
}
```

---

## 2. UI Component Contract: CategoriasComponent

### Interações e Eventos

| Ação do Usuário | Gatilho | Efeito no Estado / UI |
| :--- | :--- | :--- |
| **Abrir Nova Categoria** | Clique em `+ Nova categoria` | `isModalOpen.set(true)`, `isEditMode.set(false)`, `selectedIcon.set('sell')`, reseta form. |
| **Abrir Edição** | Clique no ícone de lápis em um cartão | `isModalOpen.set(true)`, `isEditMode.set(true)`, `editingId.set(cat.id)`, `selectedIcon.set(cat.icone \|\| 'sell')`, popula form. |
| **Selecionar Ícone** | Clique em qualquer ícone da grade | `selectedIcon.set(iconeEscolhido)` com destaque de borda ativa. |
| **Fechar / Cancelar** | Clique em `Cancelar`, botão `X` ou `Esc` | `isModalOpen.set(false)`, reseta form. |
| **Salvar Categoria** | Submissão do formulário | Valida campos, salva via `CategoriaService`, fecha modal e recarrega lista. |
| **Excluir Categoria** | Clique no ícone de lixeira em um cartão | Exibe confirmação amigável, exclui via `CategoriaService` e atualiza a lista. |

---

## 3. Curated Icon Options Contract

```typescript
export const CATEGORIA_ICONS: string[] = [
  'sell',                  // Tag padrão
  'home',                  // Moradia
  'shopping_cart',         // Compras / Supermercado
  'directions_car',        // Carro / Transporte
  'restaurant',            // Restaurante / Alimentação
  'favorite',              // Saúde / Cuidados
  'school',                // Educação
  'flight',                // Viagens
  'fitness_center',        // Academia / Exercícios
  'redeem',                // Presentes
  'wifi',                  // Internet
  'smartphone',            // Celular / Telefonia
  'bolt',                  // Luz / Energia
  'water_drop',            // Água
  'checkroom',             // Roupas / Vestuário
  'pets',                  // Pets / Animais
  'child_care',            // Bebê / Filhos
  'work',                  // Trabalho / Emprego
  'savings',               // Cofrinho / Poupança
  'credit_card',           // Cartão de Crédito
  'account_balance_wallet',// Carteira / Salário
  'movie',                 // Cinema / Filmes
  'music_note',            // Música
  'coffee',                // Café / Lanche
  'local_gas_station',     // Combustível
  'build',                 // Manutenção / Ferramentas
];
```
