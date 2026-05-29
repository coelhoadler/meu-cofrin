import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isLoginMode = signal(true);

  toggleMode(mode: 'login' | 'signup') {
    this.isLoginMode.set(mode === 'login');
    this.errorMessage.set(null);
    this.loginForm.reset();
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      if (this.isLoginMode()) {
        await this.authService.login(email!, password!);
      } else {
        await this.authService.signup(email!, password!);
      }
      this.router.navigate(['/dashboard']);
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
}
