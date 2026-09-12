# Empresas Area Tasks

## Execution Protocol

Spec: `.specs/features/empresas-area/spec.md`
**Status**: ✅ Complete — Firestore + ngx-mask + visual B2C + E-mail/Senha

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm run test` |
| Build | After phase completion or config tasks | `npm run build` |

---

## Execution Plan

### Phase 1: Cleanup (remove Data Connect)

```
T1 ✅
```

### Phase 2: Visual + Theme

```
T2 ✅ → T3 ✅
```

### Phase 3: Login & Cadastro (Firestore + ngx-mask + visual B2C)

```
T3 ✅ → T4 ✅
T3 ✅ → T5 ✅
```

### Phase 4: Build Verification

```
T4 ✅ → T6 ✅
T5 ✅ → T6 ✅
```

### Phase 5: Migração para E-mail/Senha

```
T6 ✅ → T7 ✅
T7 ✅ → T8 ✅
T8 ✅ → T9 ✅
```

---

## Task Breakdown

### T1: Remove Data Connect references from empresas-cadastro

**What**: Remover o import de `createCompanyProfile` do Data Connect no `empresas-cadastro.component.ts`.
**Where**: `src/app/features/empresas/cadastro/empresas-cadastro.component.ts`
**Depends on**: None
**Requirement**: EMP-02

**Done when**:
- [x] Import de `createCompanyProfile` removido
- [x] Chamada ao `createCompanyProfile` no `onSubmit` removida
- [x] Build compila: `npm run build`

**Gate**: build ✅

---

### T2: Verify global CSS theme-empresas

**What**: Confirmar que o `.theme-empresas` em `styles.css` já remapeia as cores de indigo para emerald/green.
**Where**: `src/styles.css`
**Depends on**: None
**Requirement**: EMP-01, EMP-05

**Done when**:
- [x] `.theme-empresas` cobre todos os overrides de cor necessários (indigo→emerald + --color-primary/hover)
- [x] Build compila

**Gate**: build ✅

---

### T3: Rewrite EmpresasLoginComponent with B2C visual + ngx-mask

**What**: Reescrever com visual B2C (fundo blur, overlay, card glassmorphism) + `ngx-mask` no CNPJ.
**Where**: `src/app/features/empresas/login/empresas-login.component.ts`
**Depends on**: T2
**Requirement**: EMP-01, EMP-04, EMP-05

**Done when**:
- [x] Template com fundo blur + overlay + card idêntico ao B2C
- [x] Campo CNPJ com `NgxMaskDirective` e mask `00.000.000/0000-00`
- [x] Campo Senha com toggle de visibilidade
- [x] Botão principal verde com spinner de loading
- [x] Mensagem de erro com estilo `bg-red-50`
- [x] Link "Não tem conta? Cadastre-se" para `/empresas/cadastro`
- [x] Footer com versão do app
- [x] Build compila

**Gate**: build ✅

---

### T4: Rewrite EmpresasCadastroComponent with B2C visual + Firestore

**What**: Reescrever com visual B2C, `ngx-mask` no CNPJ, salvar no Firestore `companies`.
**Where**: `src/app/features/empresas/cadastro/empresas-cadastro.component.ts`
**Depends on**: T3
**Requirement**: EMP-02, EMP-03, EMP-04, EMP-05

**Done when**:
- [x] Template com fundo blur + overlay + card idêntico ao B2C
- [x] Campos: Nome Fantasia, CNPJ (com ngx-mask), Senha
- [x] No submit: cria conta no Firebase Auth + salva doc na coleção `companies` do Firestore
- [x] Documento salvo contém: `nomeFantasia`, `cnpj`, `userId`, `createdAt`
- [x] Link "Já tem conta? Entrar" para `/empresas/login`
- [x] Build compila

**Gate**: build ✅

---

### T5: Update EmpresasLoginComponent to read company profile from Firestore

**What**: Após login, consultar perfil na coleção `companies` pelo `userId`.
**Where**: `src/app/features/empresas/login/empresas-login.component.ts`
**Depends on**: T3
**Requirement**: EMP-02

**Done when**:
- [x] Após autenticação, consulta o doc em `companies/{uid}`
- [x] Se perfil não encontrado, exibe mensagem de erro
- [x] Build compila

**Gate**: build ✅

---

### T6: Verify build and final review

**What**: Build final + verificação de referências quebradas.
**Where**: Projeto inteiro
**Depends on**: T4, T5

**Done when**:
- [x] `npm run build` passa sem erros (exit code 0)
- [x] Nenhuma referência a `dataconnect` / `createCompanyProfile` nos componentes de empresas
- [x] Coleção `companies` definida como target de armazenamento

**Gate**: build ✅

---

### T7: Migrar cadastro de empresas para E-mail/Senha

**What**: Substituir email sintético (CNPJ@empresas.meucofrin.com.br) por E-mail real no cadastro. Adicionar campo E-mail ao formulário, validação de e-mail duplicado via `fetchSignInMethodsForEmail`, e salvar `email` no Firestore.
**Where**: `src/app/features/empresas/cadastro/empresas-cadastro.component.ts`
**Depends on**: T6
**Requirement**: EMP-03, EMP-02

**Done when**:
- [x] Campo E-mail adicionado ao formulário com `Validators.email`
- [x] Antes do cadastro, verifica se e-mail já está em uso via `fetchSignInMethodsForEmail`
- [x] Alerta exibido se e-mail já utilizado: "Este e-mail já está em uso. Por favor, utilize um outro endereço de e-mail."
- [x] `authService.signup()` chamado com e-mail real (não sintético)
- [x] Documento no Firestore salva campo `email`
- [x] Sem login via Google
- [x] Build compila

**Gate**: build ✅

---

### T8: Migrar login de empresas para E-mail/Senha

**What**: Substituir login por CNPJ (email sintético) por login com E-mail/Senha real. Remover campo CNPJ e `NgxMaskDirective` do login.
**Where**: `src/app/features/empresas/login/empresas-login.component.ts`
**Depends on**: T7
**Requirement**: EMP-01

**Done when**:
- [x] Campo CNPJ removido do formulário de login
- [x] Campo E-mail adicionado com `Validators.email`
- [x] `NgxMaskDirective` removido dos imports do login
- [x] `authService.login()` chamado com e-mail real
- [x] Mensagem de erro atualizada para mencionar e-mail
- [x] Build compila

**Gate**: build ✅

---

### T9: Build final pós-migração E-mail/Senha

**What**: Verificação final após migração para E-mail/Senha.
**Where**: Projeto inteiro
**Depends on**: T7, T8

**Done when**:
- [x] `npm run build` passa sem erros (exit code 0)
- [x] Nenhuma referência a `syntheticEmail` ou `@empresas.meucofrin.com.br` nos componentes
- [x] Spec atualizada com campos E-mail/Senha e validação de duplicidade

**Gate**: build ✅
