import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationHistoryService } from './navigation-history.service';

describe('NavigationHistoryService', () => {
  let service: NavigationHistoryService;
  let routerEvents$: Subject<any>;
  let routerMock: any;

  beforeEach(() => {
    routerEvents$ = new Subject();
    routerMock = {
      url: '/dashboard',
      events: routerEvents$.asObservable(),
      navigateByUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NavigationHistoryService,
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(NavigationHistoryService);
  });

  it('deve ser criado com a URL inicial', () => {
    expect(service).toBeTruthy();
    expect(service.getHistory()).toEqual(['/dashboard']);
  });

  it('deve retornar /dashboard como fallback quando houver apenas 1 rota no histórico', () => {
    expect(service.previousRoute()).toBe('/dashboard');
  });

  it('deve registrar rotas internas e calcular previousRoute corretamente', () => {
    service.handleNavigation('/lancamentos');
    expect(service.getHistory()).toEqual(['/dashboard', '/lancamentos']);
    expect(service.previousRoute()).toBe('/dashboard');

    service.handleNavigation('/investimentos');
    expect(service.getHistory()).toEqual(['/dashboard', '/lancamentos', '/investimentos']);
    expect(service.previousRoute()).toBe('/lancamentos');
  });

  it('deve ignorar rotas externas como /login, /empresas, /verificar-email, /unsubscribe', () => {
    service.handleNavigation('/login');
    service.handleNavigation('/empresas/dashboard');
    service.handleNavigation('/verificar-email');
    service.handleNavigation('/verify-email');
    service.handleNavigation('/unsubscribe');
    service.handleNavigation('/');
    service.handleNavigation('');

    expect(service.getHistory()).toEqual(['/dashboard']);
  });

  it('deve ignorar duplicatas consecutivas comparando apenas o path', () => {
    service.handleNavigation('/lancamentos?tipo=Despesa');
    expect(service.getHistory()).toEqual(['/dashboard', '/lancamentos?tipo=Despesa']);

    // Mesma rota com outro query param: deve atualizar a URL do topo, sem duplicar na pilha
    service.handleNavigation('/lancamentos?tipo=Receita');
    expect(service.getHistory()).toEqual(['/dashboard', '/lancamentos?tipo=Receita']);
    expect(service.previousRoute()).toBe('/dashboard');

    // Navegação idêntica
    service.handleNavigation('/lancamentos?tipo=Receita');
    expect(service.getHistory()).toEqual(['/dashboard', '/lancamentos?tipo=Receita']);
  });

  it('deve desenrolar o histórico (unwind) ao voltar para uma rota anterior na pilha', () => {
    service.handleNavigation('/investimentos');
    service.handleNavigation('/investimentos/123/evolucao');
    expect(service.getHistory()).toEqual([
      '/dashboard',
      '/investimentos',
      '/investimentos/123/evolucao',
    ]);
    expect(service.previousRoute()).toBe('/investimentos');

    // Usuário clica em voltar e vai para /investimentos
    service.handleNavigation('/investimentos');
    expect(service.getHistory()).toEqual(['/dashboard', '/investimentos']);
    // Agora o voltar de investimentos deve apontar para o dashboard
    expect(service.previousRoute()).toBe('/dashboard');

    // Usuário clica em voltar e vai para /dashboard
    service.handleNavigation('/dashboard');
    expect(service.getHistory()).toEqual(['/dashboard']);
    expect(service.previousRoute()).toBe('/dashboard');
  });

  it('deve respeitar o limite máximo de 10 rotas no histórico', () => {
    service.clear();
    for (let i = 1; i <= 15; i++) {
      service.handleNavigation(`/rota-${i}`);
    }

    const history = service.getHistory();
    expect(history.length).toBe(10);
    expect(history[0]).toBe('/rota-6');
    expect(history[9]).toBe('/rota-15');
  });

  it('deve limpar o histórico com clear()', () => {
    service.handleNavigation('/lancamentos');
    expect(service.getHistory().length).toBe(2);

    service.clear();
    expect(service.getHistory()).toEqual([]);
    expect(service.previousRoute()).toBe('/dashboard');
  });

  it('goBack() deve navegar para previousRoute() usando router.navigateByUrl', () => {
    service.handleNavigation('/lancamentos');
    service.handleNavigation('/categorias');

    service.goBack();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/lancamentos');
  });

  it('deve reagir a eventos NavigationEnd do Router', () => {
    routerEvents$.next(new NavigationEnd(1, '/categorias', '/categorias'));

    expect(service.getHistory()).toEqual(['/dashboard', '/categorias']);
    expect(service.previousRoute()).toBe('/dashboard');
  });
});
