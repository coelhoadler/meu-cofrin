import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verificar-email.component.html'
})
export class VerificarEmailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  state = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal<string | null>(null);
  countdown = signal<number>(5);
  private timer: any = null;

  async ngOnInit(): Promise<void> {
    const oobCode = this.route.snapshot.queryParams['oobCode'];
    const mode = this.route.snapshot.queryParams['mode'];

    // Se o mode for verifyEmail (ou se o oobCode foi repassado diretamente)
    if (oobCode && (!mode || mode === 'verifyEmail')) {
      try {
        await this.authService.verifyEmailCode(oobCode);
        this.state.set('success');
        this.startRedirectCountdown();
      } catch (error: any) {
        console.error('Erro ao verificar e-mail:', error);
        this.state.set('error');
        this.errorMessage.set(this.formatErrorMessage(error));
      }
    } else {
      this.state.set('error');
      this.errorMessage.set('Código ou modo de verificação inválido/ausente na URL.');
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private startRedirectCountdown(): void {
    this.timer = setInterval(() => {
      const current = this.countdown();
      if (current > 1) {
        this.countdown.set(current - 1);
      } else {
        clearInterval(this.timer);
        this.goToDashboard();
      }
    }, 1000);
  }

  goToDashboard(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.router.navigate(['/dashboard']);
  }

  private formatErrorMessage(error: any): string {
    const code = error?.code || '';
    if (code === 'auth/invalid-action-code') {
      return 'O código de verificação é inválido ou já foi utilizado previamente.';
    } else if (code === 'auth/expired-action-code') {
      return 'O link de verificação expirou. Por favor, solicite um novo e-mail de verificação.';
    } else if (code === 'auth/user-disabled') {
      return 'Esta conta de usuário foi desativada.';
    } else if (code === 'auth/user-not-found') {
      return 'O usuário associado a este código não foi encontrado.';
    }
    return 'Ocorreu um erro ao validar seu e-mail. Tente novamente mais tarde.';
  }
}
