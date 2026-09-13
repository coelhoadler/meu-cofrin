import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService implements OnDestroy {
  private router = inject(Router);

  /**
   * Pilha de rotas internas visitadas.
   * Máximo de 10 rotas.
   */
  private readonly history = signal<string[]>([]);

  /**
   * Retorna a rota anterior para o botão "Voltar".
   * Fallback para '/dashboard' se não houver histórico anterior.
   */
  readonly previousRoute = computed<string>(() => {
    const stack = this.history();
    if (stack.length < 2) {
      return '/dashboard';
    }
    const prev = stack[stack.length - 2];
    const curr = stack[stack.length - 1];
    const prevPath = this.extractPath(prev);
    const currPath = this.extractPath(curr);

    // Se o path anterior for idêntico ao atual, fallback para dashboard
    if (prevPath === currPath) {
      return '/dashboard';
    }
    return prev;
  });

  private routerSub: Subscription;

  constructor() {
    const initialUrl = this.router.url;
    if (initialUrl && initialUrl !== '/' && this.isInternalRoute(initialUrl)) {
      this.history.set([initialUrl]);
    }

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.handleNavigation(e.urlAfterRedirects || e.url);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  /**
   * Registra a navegação e atualiza a stack do histórico.
   */
  handleNavigation(url: string): void {
    if (!this.isInternalRoute(url)) {
      return;
    }

    const newPath = this.extractPath(url);
    const currentStack = this.history();

    if (currentStack.length === 0) {
      this.history.set([url]);
      return;
    }

    const currentTop = currentStack[currentStack.length - 1];
    const topPath = this.extractPath(currentTop);

    // Pular duplicatas consecutivas comparando apenas o path (sem query params)
    if (topPath === newPath) {
      const updated = [...currentStack];
      updated[updated.length - 1] = url;
      this.history.set(updated);
      return;
    }

    // Se a rota destino já existe no histórico anterior (navegação "Voltar")
    // Desenrola a pilha até a rota de destino
    const existingIndex = currentStack
      .slice(0, -1)
      .map((u) => this.extractPath(u))
      .lastIndexOf(newPath);

    if (existingIndex !== -1) {
      const trimmed = currentStack.slice(0, existingIndex + 1);
      trimmed[trimmed.length - 1] = url;
      this.history.set(trimmed);
      return;
    }

    // Nova navegação para frente
    const nextStack = [...currentStack, url];
    if (nextStack.length > 10) {
      nextStack.shift();
    }
    this.history.set(nextStack);
  }

  /**
   * Navega para a rota anterior ou fallback dashboard.
   */
  goBack(): void {
    const target = this.previousRoute();
    this.router.navigateByUrl(target);
  }

  /**
   * Limpa o histórico de navegação (ex: no logout).
   */
  clear(): void {
    this.history.set([]);
  }

  /**
   * Retorna a lista atual de rotas no histórico (somente leitura).
   */
  getHistory(): string[] {
    return this.history();
  }

  /**
   * Extrai o pathname limpo, sem query params e sem hash.
   */
  private extractPath(url: string): string {
    return (url || '').split('?')[0].split('#')[0];
  }

  /**
   * Valida se a rota é interna da área logada do Meu Cofrin.
   */
  private isInternalRoute(url: string): boolean {
    const path = this.extractPath(url);
    if (!path || path === '' || path === '/') {
      return false;
    }

    const externalPrefixes = [
      '/login',
      '/verificar-email',
      '/verify-email',
      '/unsubscribe',
      '/empresas',
    ];

    return !externalPrefixes.some((prefix) => path.startsWith(prefix));
  }
}
