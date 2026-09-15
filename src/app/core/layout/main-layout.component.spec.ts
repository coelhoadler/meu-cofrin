import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { ContaService } from '../services/conta.service';
import { ThemeService } from '../services/theme.service';
import { TourService } from '../services/tour.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

@Component({
  template: '',
})
class DummyComponent {}

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let router: Router;
  let authServiceMock: any;
  let sessionServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal({ displayName: 'Teste', email: 'teste@email.com' }),
      logout: vi.fn(),
    };

    sessionServiceMock = {
      remainingFormatted: signal('55m restantes'),
      progressPercentage: signal(90),
      urgencyLevel: signal('normal'),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: DummyComponent },
          { path: 'lancamentos', component: DummyComponent },
          { path: 'categorias', component: DummyComponent },
        ]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: ContaService, useValue: { invalidateCache: vi.fn() } },
        { provide: ThemeService, useValue: { currentTheme: signal('light'), toggleTheme: vi.fn() } },
        { provide: TourService, useValue: { startDashboardTour: vi.fn() } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não deve exibir o botão de voltar quando estiver na rota /dashboard', () => {
    component.currentUrl.set('/dashboard');
    expect(component.isBackButtonVisible()).toBe(false);
  });

  it('deve exibir o botão de voltar quando estiver em tela interna e menu fechado', () => {
    component.currentUrl.set('/lancamentos');
    component.isSidebarOpen.set(false);
    component.layoutService.isAtBottom.set(false);

    expect(component.isBackButtonVisible()).toBe(true);
  });

  it('deve ocultar o botão de voltar quando o menu lateral mobile estiver aberto', () => {
    component.currentUrl.set('/lancamentos');
    component.isSidebarOpen.set(true);
    component.layoutService.isAtBottom.set(false);

    expect(component.isBackButtonVisible()).toBe(false);
  });

  it('deve ocultar o botão de voltar quando atingir o final da página', () => {
    component.currentUrl.set('/lancamentos');
    component.isSidebarOpen.set(false);
    component.isAtBottom.set(true);

    expect(component.isBackButtonVisible()).toBe(false);
  });

  it('deve detectar corretamente quando o scroll atinge o final da página', () => {
    const fakeContainer = {
      scrollTop: 400,
      clientHeight: 600,
      scrollHeight: 1030, // 1030 - 400 - 600 = 30 <= 40
    } as unknown as HTMLElement;

    component.onContentScroll({ target: fakeContainer } as unknown as Event);
    expect(component.isAtBottom()).toBe(true);

    // Scrollando para cima
    const fakeContainerTop = {
      scrollTop: 200,
      clientHeight: 600,
      scrollHeight: 1030, // 1030 - 200 - 600 = 230 > 40
    } as unknown as HTMLElement;

    component.onContentScroll({ target: fakeContainerTop } as unknown as Event);
    expect(component.isAtBottom()).toBe(false);
  });

  it('não deve marcar final de página se o conteúdo for curto sem barra de rolagem', () => {
    const fakeShortContainer = {
      scrollTop: 0,
      clientHeight: 600,
      scrollHeight: 610, // scrollHeight <= clientHeight + 40
    } as unknown as HTMLElement;

    component.onContentScroll({ target: fakeShortContainer } as unknown as Event);
    expect(component.isAtBottom()).toBe(false);
  });

  it('deve resetar o status de final de página ao navegar para outra rota', async () => {
    component.isAtBottom.set(true);

    await router.navigateByUrl('/categorias');

    expect(component.isAtBottom()).toBe(false);
    expect(component.currentUrl()).toBe('/categorias');
  });

  it('deve alternar a abertura da sidebar ao chamar toggleSidebar()', () => {
    expect(component.isSidebarOpen()).toBe(false);

    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(true);

    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(false);
  });

  it('deve limpar o histórico de navegação ao executar logout()', async () => {
    const clearSpy = vi.spyOn(component.navigationHistory, 'clear');
    await component.logout();
    expect(clearSpy).toHaveBeenCalled();
  });
});
