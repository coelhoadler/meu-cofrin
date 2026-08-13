# Implementation Plan: Redesign da Gestão de Categorias com Ícones

**Branch**: `002-category-icons-redesign` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-category-icons-redesign/spec.md`

## Summary

Reformular a tela de gerenciamento de categorias do MeuCofrin para adotar uma experiência moderna e visualmente atraente. A interface passa a contar com um cabeçalho limpo contendo o botão `+ Nova categoria`, uma grade de cartões elegantes para a listagem das categorias com ícones em destaque e botões de ação rápida (editar e excluir), e uma janela modal responsiva para cadastro e edição contendo um seletor visual de ícones financeiros curados (`material-symbols`). O campo obsoleto de cor (`cor`) é removido do fluxo de criação e edição, persistindo o identificador textual do ícone no Firestore com fallback automático para o ícone padrão (`sell`) em categorias legadas.

## Technical Context

**Language/Version**: TypeScript 5.8+ / JavaScript ES2022+  
**Primary Dependencies**: Angular 21 (Zoneless, Signals), `@angular/fire` / Firebase 12, `material-symbols`  
**Storage**: Cloud Firestore (subcoleção `users/{uid}/categorias`)  
**Testing**: Vitest (`npm test`), Playwright (`npm run e2e`)  
**Target Platform**: Web Moderno (PWA / Mobile-First & Desktop)  
**Project Type**: Single-Page Web Application (Frontend Angular)  
**Performance Goals**: Renderização instantânea da modal (< 16ms frame budget), carregamento da lista < 200ms  
**Constraints**: Zero introdução de novas dependências npm, total compatibilidade com categorias antigas sem o campo `icone`, conformidade total com a Constituição MeuCofrin  
**Scale/Scope**: 1 componente de página (`CategoriasComponent`), 1 serviço core (`CategoriaService`), interfaces e templates associados  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. User-Centric Simplicity & Friendly UI**: Interface intuitiva com feedback visual claro, cartões modernos e modal direta sem poluição visual.
- [x] **II. Signals-First & Zoneless Reactivity**: Gerenciamento de estado 100% fundamentado em Angular Signals (`signal()`), sem dependência de `zone.js`.
- [x] **III. Firebase Suite Services Integration**: Operações de persistência diretas via `@angular/fire` e Cloud Firestore.
- [x] **IV. PrimeNG & Accessible Componentization**: Estilização com Tailwind CSS, ícones com Material Symbols acessíveis e foco em navegação mobile-first.
- [x] **V. Quality, Observability & Testability**: Código limpo, componentizado, com testes unitários em Vitest.

## Project Structure

### Documentation (this feature)

```text
specs/002-category-icons-redesign/
├── spec.md                  # Especificação funcional do recurso
├── plan.md                  # Este plano de implementação
├── research.md              # Decisões de pesquisa (biblioteca de ícones, fallback)
├── data-model.md            # Modelo de dados e tipagem no Firestore
├── quickstart.md            # Guia de teste e validação manual/automatizada
├── contracts/
│   └── category-ui.contract.md # Contratos de interface e catálogo de ícones
├── checklists/
│   └── requirements.md      # Checklist de qualidade dos requisitos
└── tasks.md                 # Tarefas geradas pelo /speckit-tasks
```

### Source Code (repository root)

```text
src/app/
├── core/
│   └── services/
│       └── categoria.service.ts       # [MODIFY] Atualização da interface Categoria com 'icone?: string'
└── features/
    └── categorias/
        ├── categorias.component.ts    # [MODIFY] Atualização da lógica com Signals, modal state e catálogo de ícones
        ├── categorias.component.html  # [MODIFY] Novo layout com Header, Grid de Cartões, Modal e Seletor de Ícones
        └── categorias.component.spec.ts # [NEW/MODIFY] Testes unitários com Vitest
```

**Structure Decision**: A aplicação segue a arquitetura padrão do MeuCofrin em Angular 21, mantendo a separação entre `core/services` e `features/categorias`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *Nenhuma violação identificada* | N/A | N/A |
