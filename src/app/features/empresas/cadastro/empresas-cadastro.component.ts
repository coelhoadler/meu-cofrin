import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { NgxMaskDirective } from 'ngx-mask';
import * as packageJson from '../../../../../package.json';

@Component({
  selector: 'app-empresas-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div
      class="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans text-slate-800 overflow-hidden">
      <!-- Fundo com a imagem e Blur -->
      <div class="absolute inset-0 -z-20 scale-110 animate-slow-pan" style="
          background-image: url('/auth-hero.jpg');
          background-size: cover;
          background-position: center;
          filter: blur(40px);
        "></div>

      <!-- Overlay branco para clarear bastante a imagem -->
      <div class="absolute inset-0 bg-white/85 -z-10"></div>

      <!-- Cabeçalho (Logo e Textos) -->
      <div class="flex flex-col items-center mb-8 z-10">
        <img src="logo.png" alt="Logotipo" class="w-24 h-24 object-contain" />

        <h1 class="text-2xl font-bold text-slate-900 text-center">Meu Cofrin <span class="text-emerald-600">Empresas</span></h1>
        <p class="text-slate-600 mt-1 text-center text-sm font-medium">
          Crie sua conta corporativa.
        </p>
      </div>

      <!-- Cadastro Card -->
      <div
        class="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl shadow-emerald-900/10 overflow-hidden p-8 z-10 border border-slate-100">

        <!-- Formulário -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Nome Fantasia -->
          <div class="space-y-1">
            <label for="nomeFantasia" class="text-xs font-semibold text-slate-600 ml-1">Nome Fantasia <span
                class="text-red-500">*</span></label>
            <input id="nomeFantasia" type="text" formControlName="nomeFantasia"
              placeholder="Nome da empresa"
              autocomplete="organization"
              class="w-full px-4 py-3 !bg-white !border !border-slate-200 rounded-2xl !text-slate-900 placeholder:!text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
            @if (form.get('nomeFantasia')?.touched && form.get('nomeFantasia')?.invalid && form.get('nomeFantasia')?.dirty) {
              <div class="text-red-500 text-xs ml-1 mt-1 font-medium">O nome fantasia é obrigatório.</div>
            }
          </div>

          <!-- CNPJ -->
          <div class="space-y-1">
            <label for="cnpj" class="text-xs font-semibold text-slate-600 ml-1">CNPJ <span
                class="text-red-500">*</span></label>
            <input id="cnpj" type="text" formControlName="cnpj"
              placeholder="00.000.000/0000-00"
              mask="00.000.000/0000-00"
              [dropSpecialCharacters]="true"
              autocomplete="off"
              class="w-full px-4 py-3 !bg-white !border !border-slate-200 rounded-2xl !text-slate-900 placeholder:!text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
            @if (form.get('cnpj')?.touched && form.get('cnpj')?.invalid && form.get('cnpj')?.dirty) {
              <div class="text-red-500 text-xs ml-1 mt-1 font-medium">Insira um CNPJ válido (14 dígitos).</div>
            }
          </div>

          <!-- E-mail -->
          <div class="space-y-1">
            <label for="email" class="text-xs font-semibold text-slate-600 ml-1">E-mail <span
                class="text-red-500">*</span></label>
            <input id="email" type="email" formControlName="email"
              placeholder="empresa@exemplo.com"
              autocomplete="email"
              class="w-full px-4 py-3 !bg-white !border !border-slate-200 rounded-2xl !text-slate-900 placeholder:!text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
            @if (form.get('email')?.touched && form.get('email')?.invalid && form.get('email')?.dirty) {
              <div class="text-red-500 text-xs ml-1 mt-1 font-medium">Insira um e-mail válido.</div>
            }
          </div>

          <!-- Senha -->
          <div class="space-y-1">
            <div class="flex items-center justify-between ml-1">
              <label for="password" class="text-xs font-semibold text-slate-600">Senha <span
                  class="text-red-500">*</span></label>
            </div>
            <div class="relative">
              <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="senha"
                autocomplete="new-password" placeholder="Mínimo 6 caracteres"
                class="w-full px-4 py-3 !bg-white !border !border-slate-200 rounded-2xl !text-slate-900 placeholder:!text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm pr-12" />
              <button type="button" (click)="togglePasswordVisibility()"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none">
                @if (!showPassword()) {
                  <span class="material-symbols-outlined text-xl">visibility</span>
                }
                @if (showPassword()) {
                  <span class="material-symbols-outlined text-xl">visibility_off</span>
                }
              </button>
            </div>
            @if (form.get('senha')?.touched && form.get('senha')?.invalid && form.get('senha')?.dirty) {
              <div class="text-red-500 text-xs ml-1 mt-1 font-medium">A senha deve ter no mínimo 6 caracteres.</div>
            }
          </div>

          <!-- Mensagem de Erro -->
          @if (errorMessage()) {
            <div class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">
              {{ errorMessage() }}
            </div>
          }

          <!-- Botão de Ação -->
          <button type="submit"
            [disabled]="form.invalid || isLoading()"
            class="w-full mt-6 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 text-sm">
            @if (!isLoading()) {
              Criar conta
            }
            @if (isLoading()) {
              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            }
          </button>

          <!-- Separador -->
          <div class="flex items-center gap-3 mt-4 mb-2">
            <div class="h-px bg-slate-200 flex-1"></div>
            <span class="text-xs font-medium text-slate-400">OU</span>
            <div class="h-px bg-slate-200 flex-1"></div>
          </div>

          <!-- Link para Login -->
          <div class="text-center">
            <a routerLink="/empresas/login" class="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
              Já tem conta? Entrar
            </a>
          </div>
        </form>
      </div>

      <!-- App Version Footer -->
      <div
        class="fixed bottom-2 right-2 text-xs font-mono text-slate-500 bg-white/80 px-2 py-1 rounded pointer-events-none z-[9999]">
        v{{ version() }}
      </div>
    </div>
  `
})
export class EmpresasCadastroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  form = this.fb.group({
    nomeFantasia: ['', Validators.required],
    cnpj: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  version = signal(packageJson.version);

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { nomeFantasia, cnpj, email, senha } = this.form.value;

    try {
      // 1. Verifica se o e-mail já está em uso
      const signInMethods = await fetchSignInMethodsForEmail(this.auth, email!);
      if (signInMethods.length > 0) {
        this.errorMessage.set('Este e-mail já está em uso. Por favor, utilize um outro endereço de e-mail.');
        this.isLoading.set(false);
        return;
      }

      // 2. Cria conta no Firebase Auth com e-mail e senha
      const userCredential = await this.authService.signup(email!, senha!, nomeFantasia!);

      // 3. Salva perfil da empresa no Firestore (users/{uid}.perfil)
      const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
      await setDoc(userDocRef, {
        perfil: {
          nomeFantasia: nomeFantasia,
          cnpj: cnpj,
          email: email,
          tipo: 'empresa',
          displayName: nomeFantasia
        },
        createdAt: serverTimestamp()
      }, { merge: true });

      // 4. Redireciona para dashboard
      this.router.navigate(['/empresas/dashboard']);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        this.errorMessage.set('Este e-mail já está em uso. Por favor, utilize um outro endereço de e-mail.');
      } else {
        this.errorMessage.set('Erro ao criar conta. Tente novamente.');
      }
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
