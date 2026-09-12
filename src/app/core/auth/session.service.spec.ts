import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { SessionService } from './session.service';
import { SESSION_DURATION_MINUTES } from './session.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SessionService', () => {
  let service: SessionService;
  let routerMock: any;
  let authMock: any;

  beforeEach(() => {
    vi.useFakeTimers();

    routerMock = {
      url: '/dashboard',
      navigate: vi.fn().mockResolvedValue(true),
    };

    authMock = {
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: Router, useValue: routerMock },
        { provide: Auth, useValue: authMock },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve inicializar com valores padrão corretos', () => {
    expect(service.durationMinutes).toBe(SESSION_DURATION_MINUTES);
    expect(service.isExpired()).toBe(false);
    expect(service.showExpiredModal()).toBe(false);
    expect(service.remainingSeconds()).toBe(SESSION_DURATION_MINUTES * 60);
  });

  it('deve calcular porcentagem e formatação de tempo corretamente', () => {
    // Definindo restante para 30 minutos (metade do tempo padrão de 60m)
    service.remainingSeconds.set(30 * 60);

    expect(service.remainingMinutes()).toBe(30);
    expect(service.remainingFormatted()).toBe('30m restantes');
    expect(service.progressPercentage()).toBe(50);
    expect(service.urgencyLevel()).toBe('normal');

    // 10 minutos restantes (warning)
    service.remainingSeconds.set(10 * 60);
    expect(service.urgencyLevel()).toBe('warning');

    // 3 minutos restantes (danger)
    service.remainingSeconds.set(3 * 60);
    expect(service.urgencyLevel()).toBe('danger');

    // 45 segundos restantes
    service.remainingSeconds.set(45);
    expect(service.remainingFormatted()).toBe('45s restantes');

    // 0 segundos
    service.remainingSeconds.set(0);
    expect(service.remainingFormatted()).toBe('0m restantes');
    expect(service.progressPercentage()).toBe(0);
  });

  it('deve inicializar a sessão com auth_time do usuário e disparar verificação', async () => {
    const fakeAuthTimeSec = Math.floor(Date.now() / 1000) - 600; // 10 minutos atrás
    const fakeUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { auth_time: fakeAuthTimeSec },
      }),
    } as any;

    await service.initSession(fakeUser);

    expect(service.authTime()).toBe(fakeAuthTimeSec * 1000);
    // Deve restar aprox 50 minutos (60 - 10)
    expect(service.remainingMinutes()).toBe(50);
    expect(service.isExpired()).toBe(false);
  });

  it('deve detectar sessão expirada no checkSession e exibir modal', () => {
    // auth_time há 2 horas atrás (mais que 60m)
    const pastTime = Date.now() - 2 * 60 * 60 * 1000;
    service.authTime.set(pastTime);

    const expired = service.checkSession();

    expect(expired).toBe(true);
    expect(service.isExpired()).toBe(true);
    expect(service.showExpiredModal()).toBe(true);
    expect(service.remainingSeconds()).toBe(0);
  });

  it('deve direcionar para /empresas/login quando a rota for corporativa', () => {
    routerMock.url = '/empresas/dashboard';

    service.handleSessionExpired();

    expect(service.showExpiredModal()).toBe(true);
    expect(service.targetLoginRoute()).toBe('/empresas/login');
  });

  it('deve direcionar para /login quando a rota for pessoal', () => {
    routerMock.url = '/dashboard';

    service.handleSessionExpired();

    expect(service.showExpiredModal()).toBe(true);
    expect(service.targetLoginRoute()).toBe('/login');
  });

  it('deve deslogar e navegar para rota de login ao confirmar no modal', async () => {
    service.targetLoginRoute.set('/empresas/login');
    service.showExpiredModal.set(true);

    await service.confirmExpiredLogout();

    expect(authMock.signOut).toHaveBeenCalled();
    expect(service.showExpiredModal()).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/empresas/login']);
  });
});
