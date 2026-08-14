# Data Model: Redesign da Gestão de Categorias com Ícones

**Feature**: `002-category-icons-redesign`  
**Date**: 2026-08-13  
**Status**: Completed  

---

## 1. Firestore Data Entity: Categoria

O modelo de dados de categorias reside na subcoleção do usuário no Firestore:  
`users/{userId}/categorias/{categoriaId}`

### Schema Definition (TypeScript Interface)

```typescript
export interface Categoria {
  /** Identificador único gerado automaticamente pelo Firestore */
  id?: string;

  /** Nome descritivo da categoria (Obrigatório, min 1 caractere) */
  nome: string;

  /** Descrição detalhada ou notas da categoria (Opcional) */
  descricao?: string;

  /** Tipo do lançamento financeiro ('Despesa' | 'Receita') */
  tipo: 'Despesa' | 'Receita';

  /** Nome identificador do ícone Material Symbols (ex: 'home', 'restaurant', 'sell') */
  icone?: string;

  /** Campo legado descontinuado - mantido apenas para compatibilidade de leitura */
  cor?: string;

  /** Timestamp de criação do documento no servidor */
  createdAt?: any;
}
```

---

## 2. Validation & Integrity Rules

| Campo | Tipo | Obrigatoriedade | Regras de Validação | Valor Padrão |
| :--- | :--- | :--- | :--- | :--- |
| `nome` | `string` | Obrigatório | Não vazio, trim de espaços, máximo 60 caracteres | `""` |
| `descricao`| `string` | Opcional | Máximo 250 caracteres | `""` |
| `tipo` | `enum` | Obrigatório | Valor deve ser `'Despesa'` ou `'Receita'` | `'Despesa'` |
| `icone` | `string` | Opcional (persistido) | Deve pertencer à lista de ícones permitidos | `'sell'` |
| `cor` | `string` | Descontinuado | Não é mais enviado na criação/atualização | `undefined` |

---

## 3. Fallback & Migration Logic

```text
+------------------------------------+
|  Leitura do Documento Firestore   |
+------------------------------------+
                  |
                  v
       Existe campo 'icone'?
             /         \
          Sim           Não (Legado)
          /               \
         v                 v
   icone = doc.icone    icone = 'sell' (Fallback Padrão)
```

---

## 4. UI State Model (Angular Signals)

```typescript
export interface CategoriasComponentState {
  categorias: Signal<Categoria[]>;
  isModalOpen: Signal<boolean>;
  isEditMode: Signal<boolean>;
  editingId: Signal<string | null>;
  selectedIcon: Signal<string>;
  isLoading: Signal<boolean>;
  errorMessage: Signal<string | null>;
}
```

---

## 5. Visual Representation & Theme Contrast Mapping

| Tipo | Componente Visual | Light Mode | Dark Mode | Contraste / Acessibilidade |
| :--- | :--- | :--- | :--- | :--- |
| **Despesa** | Contêiner do Ícone | `bg-rose-50 text-rose-600` | `dark:bg-rose-950/40 dark:text-rose-400` | WCAG AA/AAA (> 4.8:1 Light, > 7.5:1 Dark) |
| **Despesa** | Badge de Tipo | `bg-rose-50 text-rose-600 border-rose-200/80` | `dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60` | Alto contraste e identificação visual instantânea |
| **Despesa** | Botão no Modal | `border-rose-500/50 bg-rose-50 text-rose-600` | `dark:bg-rose-950/30 dark:text-rose-400` | Estado selecionado ativo com anel de foco |
| **Receita** | Contêiner do Ícone | `bg-emerald-50 text-emerald-600` | `dark:bg-emerald-950/40 dark:text-emerald-400` | WCAG AA/AAA (> 4.6:1 Light, > 9.1:1 Dark) |
| **Receita** | Badge de Tipo | `bg-emerald-50 text-emerald-600 border-emerald-200/80` | `dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60` | Alto contraste e identificação visual instantânea |
| **Receita** | Botão no Modal | `border-emerald-500/50 bg-emerald-50 text-emerald-600` | `dark:bg-emerald-950/30 dark:text-emerald-400` | Estado selecionado ativo com anel de foco |

