import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState, User } from '@angular/fire/auth';
import { SESSION_DURATION_MINUTES, SESSION_DURATION_MS } from './session.config';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private router = inject(Router);
  private auth = inject(Auth, { optional: true });

  readonly durationMinutes = SESSION_DURATION_MINUTES;
  readonly durationMs = SESSION_DURATION_MS;

  // Estado Reativo (Signals)
  readonly authTime = signal<number | null>(null);
  readonly remainingSeconds = signal<number>(SESSION_DURATION_MINUTES * 60);
  readonly isExpired = signal<boolean>(false);
  readonly showExpiredModal = signal<boolean>(false);
  readonly targetLoginRoute = signal<string>('/login');

  private timerId: any = null;

  // Computeds
  readonly remainingMinutes = computed(() => {
    return Math.max(0, Math.ceil(this.remainingSeconds() / 60));
  });

  readonly remainingFormatted = computed(() => {
    const sec = this.remainingSeconds();
    if (sec <= 0) return '0m restantes';
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (min === 0) return `${remSec}s restantes`;
    return `${min}m restantes`;
  });

  readonly progressPercentage = computed(() => {
    const totalSec = this.durationMinutes * 60;
    if (totalSec <= 0) return 0;
    const pct = (this.remainingSeconds() / totalSec) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  });

  readonly urgencyLevel = computed<'normal' | 'warning' | 'danger'>(() => {
    const min = this.remainingMinutes();
    if (min <= 5) return 'danger';
    if (min <= 15) return 'warning';
    return 'normal';
  });

  constructor() {
    this.initVisibilityListener();

    if (this.auth) {
      authState(this.auth).subscribe((user) => {
        if (user) {
          this.initSession(user);
        } else {
          this.stopTimer();
          this.authTime.set(null);
          this.remainingSeconds.set(this.durationMinutes * 60);
          this.isExpired.set(false);
          // Não fecha o modal se a sessão acabou de expirar, permitindo o usuário ver a confirmação
        }
      });
    }
  }

  /**
   * Inicializa o cronômetro da sessão baseado no auth_time do usuário.
   */
  async initSession(user: User): Promise<void> {
    try {
      const idTokenResult = await user.getIdTokenResult();
      const tokenAuthTime = Number(idTokenResult?.claims?.['auth_time'] || 0) * 1000;
      const initialAuthTime = tokenAuthTime > 0 ? tokenAuthTime : Date.now();

      this.authTime.set(initialAuthTime);
      this.checkSession();
      this.startTimer();
    } catch (e) {
      console.error('Erro ao ler auth_time do token:', e);
      this.authTime.set(Date.now());
      this.startTimer();
    }
  }

  /**
   * Recalcula o tempo restante e verifica se a sessão expirou.
   */
  checkSession(): boolean {
    const authT = this.authTime();
    if (!authT) {
      return false;
    }

    const now = Date.now();
    const elapsedMs = now - authT;
    const remainingMs = this.durationMs - elapsedMs;

    if (remainingMs <= 0) {
      this.remainingSeconds.set(0);
      this.isExpired.set(true);
      this.handleSessionExpired();
      return true;
    }

    this.remainingSeconds.set(Math.floor(remainingMs / 1000));
    this.isExpired.set(false);
    return false;
  }

  /**
   * Dispara a exibição do modal de sessão expirada.
   */
  handleSessionExpired(targetRoute?: string): void {
    if (targetRoute) {
      this.targetLoginRoute.set(targetRoute);
    } else {
      const currentUrl = this.router.url || '';
      if (currentUrl.startsWith('/empresas')) {
        this.targetLoginRoute.set('/empresas/login');
      } else {
        this.targetLoginRoute.set('/login');
      }
    }

    this.isExpired.set(true);
    this.remainingSeconds.set(0);
    this.showExpiredModal.set(true);
    this.stopTimer();
  }

  /**
   * Fecha o modal, limpa a sessão e redireciona para a tela de login adequada.
   */
  async confirmExpiredLogout(): Promise<void> {
    this.showExpiredModal.set(false);
    const destRoute = this.targetLoginRoute();

    if (this.auth) {
      try {
        await this.auth.signOut();
      } catch (e) {
        console.warn('Erro ao deslogar no Firebase Auth:', e);
      }
    }

    this.router.navigate([destRoute]);
  }

  private startTimer(): void {
    this.stopTimer();
    if (this.isExpired()) return;

    this.timerId = setInterval(() => {
      const expired = this.checkSession();
      if (expired) {
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private initVisibilityListener(): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const syncOnFocus = () => {
        if (document.visibilityState === 'visible') {
          this.checkSession();
        }
      };

      document.addEventListener('visibilitychange', syncOnFocus);
      window.addEventListener('focus', syncOnFocus);
    }
  }
}
