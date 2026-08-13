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
| **Abrir Nova Categoria** | Clique em `+ Nova categoria` | `isModalOpen.set(true)`, `isEditMode.set(false)`, `selectedIcon.set('sell')`, reseta form com `tipo: 'Despesa'`. |
| **Abrir Edição** | Clique no ícone de lápis em um cartão | `isModalOpen.set(true)`, `isEditMode.set(true)`, `editId.set(cat.id)`, `selectedIcon.set(cat.icone \|\| 'sell')`, popula form com nome, descrição e tipo. |
| **Alternar Tipo** | Clique em Despesa ou Receita no modal | Atualiza controle `tipo` no formulário com anel de foco e cor ativa correspondente. |
| **Selecionar Ícone** | Clique em qualquer ícone da grade | `selectedIcon.set(iconeEscolhido)` com destaque de borda e fundo ativos. |
| **Fechar / Cancelar** | Clique em `Cancelar`, botão `X` ou `Esc` | `isModalOpen.set(false)`, reseta form. |
| **Salvar Categoria** | Submissão do formulário | Valida campos, salva via `CategoriaService`, fecha modal e recarrega lista. |
| **Excluir Categoria** | Clique no ícone de lixeira em um cartão | Exibe confirmação amigável, exclui via `CategoriaService` e atualiza a lista. |
| **Voltar ao Dashboard** | Clique no botão Voltar (desktop) ou botão flutuante FAB (mobile) | Redireciona para `/dashboard`. |

---

## 3. Curated Icon Options Contract

```typescript
export interface CategoriaIconOption {
  name: string;
  title: string;
}

export const CATEGORIA_ICONS: CategoriaIconOption[] = [
  { name: 'sell', title: 'Geral / Outros' },
  { name: 'home', title: 'Moradia' },
  { name: 'shopping_cart', title: 'Mercado / Compras' },
  { name: 'directions_car', title: 'Transporte / Carro' },
  { name: 'restaurant', title: 'Alimentação / Restaurante' },
  { name: 'favorite', title: 'Saúde / Bem-estar' },
  { name: 'school', title: 'Educação' },
  { name: 'flight', title: 'Viagens' },
  { name: 'fitness_center', title: 'Academia / Esportes' },
  { name: 'redeem', title: 'Presentes / Doações' },
  { name: 'wifi', title: 'Internet / Assinaturas' },
  { name: 'smartphone', title: 'Celular / Telefonia' },
  { name: 'bolt', title: 'Luz / Energia' },
  { name: 'water_drop', title: 'Água / Saneamento' },
  { name: 'checkroom', title: 'Vestuário / Roupas' },
  { name: 'pets', title: 'Pets / Animais' },
  { name: 'child_care', title: 'Filhos / Bebê' },
  { name: 'work', title: 'Trabalho / Salário' },
  { name: 'savings', title: 'Investimentos / Poupança' },
  { name: 'credit_card', title: 'Cartão de Crédito' },
  { name: 'account_balance_wallet', title: 'Carteira / Finanças' },
  { name: 'movie', title: 'Entretenimento / Lazer' },
  { name: 'music_note', title: 'Música / Shows' },
  { name: 'coffee', title: 'Cafeteria / Lanches' },
  { name: 'local_gas_station', title: 'Combustível' },
  { name: 'build', title: 'Serviços / Manutenção' },
];
```

---

## 4. Theme & Color Token Contract

- **Despesa**:
  - Light Mode: `bg-rose-50 text-rose-600 border-rose-200/80`
  - Dark Mode: `dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60`
- **Receita**:
  - Light Mode: `bg-emerald-50 text-emerald-600 border-emerald-200/80`
  - Dark Mode: `dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60`

