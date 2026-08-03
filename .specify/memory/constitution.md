<!--
SYNC IMPACT REPORT
- Version Change: 0.0.0 (Template) → 1.0.0
- Modified Principles: N/A (Initial constitution ratification)
- Added Sections:
  - Core Principles (I. User-Centric Simplicity & Friendly UI, II. Signals-First & Zoneless Reactivity, III. Firebase Suite Services Integration, IV. PrimeNG & Accessible Componentization, V. Quality, Observability & Testability)
  - Technical Stack & Architectural Standards
  - User Experience & Financial Interface Guidelines
  - Governance & Compliance Review
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ aligned)
  - .specify/templates/spec-template.md (✅ aligned)
  - .specify/templates/tasks-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# MeuCofrin Constitution

## Core Principles

### I. User-Centric Simplicity & Friendly UI
MeuCofrin MUST remain a simple, intuitive, and frictionless financial application. Every interface design and user workflow MUST prioritize clarity, immediate usability, clean visual feedback, and zero unnecessary visual or cognitive complexity for non-technical users managing their daily finances.

### II. Signals-First & Zoneless Reactivity
All state management MUST leverage Angular Signals (`signal`, `computed`, `resource`, `linkedSignal`) and modern Signal-driven Forms (Angular 21+). The application MUST operate with Zoneless change detection (`provideZonelessChangeDetection()`). Imperative state mutations and legacy `zone.js` dependencies are strictly forbidden.

### III. Firebase Suite Services Integration
Backend services MUST rely on Firebase suite integrations (`@angular/fire` and Firebase Web SDK 12+). Firestore MUST be used as the primary database with robust offline capabilities and strict security rules. Firebase Auth handles identity, Cloud Functions handle asynchronous background tasks/triggers, Cloud Storage manages user attachments/avatars, and Firebase Analytics & Messaging power user engagement.

### IV. PrimeNG & Accessible Componentization
UI components MUST be constructed using PrimeNG 21 (`@primeng/themes` Aura preset) complemented by Tailwind CSS for custom utility styling. Custom components MUST follow Angular Aria standards for full accessibility, responsive design, and multi-device usability (mobile-first layout).

### V. Quality, Observability & Testability
All features MUST maintain continuous observability through Sentry (`@sentry/angular`) error tracking and performance profiling. Code additions MUST include unit tests written in Vitest (`ng test`) and end-to-end user journey validations powered by Playwright (`ng e2e`). Scaffolding and refactoring MUST conform strictly to Angular CLI standards.

## Technical Stack & Architectural Standards

- **Framework**: Angular 21 (Zoneless, Signals-first, Standalone Components, Signal Forms).
- **Backend & Database**: Firebase Suite (Authentication, Cloud Firestore, Cloud Functions, Cloud Storage, Analytics, Messaging, Performance Monitoring).
- **Design System & Components**: PrimeNG 21 (`@primeng/themes` Aura preset), Tailwind CSS, Material Symbols / PrimeIcons, `ngx-mask`, `ngx-toastr`.
- **Localization**: Native Portuguese (pt-BR) formatting for currency, dates, numbers, and calendar pickers.
- **Progressive Web App (PWA)**: Angular Service Worker for offline capabilities, client hydration, and fast loading.

## User Experience & Financial Interface Guidelines

- Financial figures MUST be clearly formatted using `pt-BR` locale rules (BRL `R$`).
- Interactive dashboards and balance cards MUST provide responsive, non-overflowing typography using fluid font sizes (e.g. CSS `clamp()`).
- Error messages MUST be user-friendly, empathetic, and actionable, avoiding raw technical exceptions or stack traces in the UI.

## Governance & Compliance Review

- All pull requests, feature specifications, and implementation plans MUST verify compliance against this Constitution.
- Changes or additions to architecture (e.g., adding state management libraries, third-party UI toolkits) require explicit Constitution amendments.
- Redundant dependencies or legacy zone.js-based libraries MUST NOT be introduced.

**Version**: 1.0.0 | **Ratified**: 2026-07-30 | **Last Amended**: 2026-07-30
