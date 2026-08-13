# Quickstart & Validation Guide: Redesign da Gestão de Categorias com Ícones

**Feature**: `002-category-icons-redesign`  
**Date**: 2026-08-13  
**Status**: Completed  

---

## 1. Pré-requisitos & Execução Local

```bash
# Executar a aplicação em ambiente de desenvolvimento
npm start
```

Acesse no navegador: `http://localhost:4200/categorias` (ou navegue até a tela de categorias pelo menu do aplicativo).

---

## 2. Cenários de Validação Manual

### Cenário 1: Listagem Inicial e Fallback de Ícones
1. Acesse a rota `/categorias`.
2. Verifique se o botão `+ Nova categoria` está visível no topo direito.
3. Observe os cartões de categorias existentes:
   - Categorias com ícone salvo exibem seu ícone específico.
   - Categorias legadas (sem o campo `icone`) exibem o ícone padrão de etiqueta (`sell`) com fundo lilás e sem quebras visuais.
   - Cada cartão exibe o nome, o botão de edição (lápis) e o botão de exclusão (lixeira).

### Cenário 2: Cadastro de Nova Categoria com Ícone
1. Clique no botão `+ Nova categoria`.
2. A janela modal deve abrir com foco suave e fundo escurecido.
3. Preencha o campo **Nome** (ex: "Academia").
4. (Opcional) Preencha o campo **Descrição** (ex: "Mensalidade e suplementos").
5. Na grade de **Ícones**, clique sobre o ícone de haltere (`fitness_center`).
6. Verifique se o ícone clicado fica selecionado com destaque de borda roxa e fundo suave.
7. Clique em **Salvar**.
8. A modal deve fechar e a nova categoria deve aparecer imediatamente na listagem com o ícone de haltere.

### Cenário 3: Edição de Categoria Existente
1. Em qualquer cartão de categoria, clique no botão de lápis (Editar).
2. A modal deve abrir com o título "Editar categoria", o campo Nome preenchido e o ícone atual selecionado.
3. Altere o ícone (ex: escolha `shopping_cart`) ou ajuste o nome.
4. Clique em **Salvar**.
5. A modal deve fechar e o cartão da categoria deve refletir a alteração imediatamente.

### Cenário 4: Exclusão de Categoria
1. Clique no ícone de lixeira (Excluir) em um cartão.
2. Confirme o diálogo de confirmação.
3. O cartão correspondente é removido imediatamente da lista.

---

## 3. Validação Automatizada de Testes

```bash
# Executar testes unitários com Vitest
npm test

# Executar testes end-to-end com Playwright
npm run e2e
```
