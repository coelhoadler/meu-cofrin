import { Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { WebauthnService } from '../../core/auth/webauthn.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InputTextModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private webauthnService = inject(WebauthnService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    nome: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isLoginMode = signal(true);
  showPassword = signal(false);
  hasBiometricsConfigured = signal(localStorage.getItem('biometricsEnabled') === 'true');

  @ViewChild('nomeInput') nomeInput?: ElementRef<HTMLInputElement>;
  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    setTimeout(() => {
      this.emailInput?.nativeElement.focus();
    }, 0);
  }

  toggleMode(mode: 'login' | 'signup') {
    this.isLoginMode.set(mode === 'login');
    this.errorMessage.set(null);
    this.loginForm.reset();
    this.showPassword.set(false);

    setTimeout(() => {
      if (mode === 'signup') {
        this.nomeInput?.nativeElement.focus();
      } else {
        this.emailInput?.nativeElement.focus();
      }
    }, 0);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password, nome } = this.loginForm.value;

    try {
      if (this.isLoginMode()) {
        await this.authService.login(email!, password!);
      } else {
        await this.authService.signup(email!, password!, nome);
      }
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      const message = this.isLoginMode()
        ? 'Falha no login. Verifique suas credenciais.'
        : 'Falha ao criar conta. O e-mail pode já estar em uso.';
      this.errorMessage.set(message);
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithBiometrics() {
    this.errorMessage.set(null);
    const email = localStorage.getItem('biometricEmail');

    if (!email) {
      this.errorMessage.set('Nenhum e-mail salvo para biometria. Faça login com senha primeiro.');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.webauthnService.authenticateWithPasskey(email);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Falha ao autenticar com biometria.');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.loginWithGoogle();
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      this.errorMessage.set('Falha ao autenticar com o Google. Tente novamente.');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
