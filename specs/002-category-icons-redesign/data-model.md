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
