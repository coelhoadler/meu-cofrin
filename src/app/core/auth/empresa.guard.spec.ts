import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of, firstValueFrom, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { empresaGuard } from './empresa.guard';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

vi.mock('@angular/fire/auth', () => ({
  Auth: vi.fn(),
  authState: vi.fn(),
}));

describe('empresaGuard', () => {
  let authMock: any;
  let authServiceMock: any;
  let sessionServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authMock = {};
    authServiceMock = {
      isSessionExpired: vi.fn().mockResolvedValue(false),
      logout: vi.fn().mockResolvedValue(undefined),
      isEmpresaAccount: vi.fn().mockResolvedValue(true),
    };
    sessionServiceMock = {
      handleSessionExpired: vi.fn(),
    };
    routerMock = {
      createUrlTree: vi.fn((commands, extras) => ({ commands, extras } as unknown as UrlTree)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: Firestore, useValue: {} },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('deve redirecionar para /empresas/login quando o usuário não estiver autenticado', async () => {
    vi.mocked(authState).mockReturnValue(of(null));

    const result = TestBed.runInInjectionContext(() =>
      empresaGuard({} as any, { url: '/empresas/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/empresas/login'], {
      queryParams: { returnUrl: '/empresas/dashboard' },
    });
    expect(guardResult).toEqual({
      commands: ['/empresas/login'],
      extras: { queryParams: { returnUrl: '/empresas/dashboard' } },
    });
  });

  it('deve disparar handleSessionExpired e permitir a rota quando a sessão estiver expirada', async () => {
    const mockUser = { uid: 'empresa123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));
    authServiceMock.isSessionExpired.mockResolvedValue(true);

    const result = TestBed.runInInjectionContext(() =>
      empresaGuard({} as any, { url: '/empresas/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(sessionServiceMock.handleSessionExpired).toHaveBeenCalledWith('/empresas/login');
    expect(guardResult).toBe(true);
  });

  it('deve permitir acesso (true) quando o usuário for uma conta de empresa', async () => {
    const mockUser = { uid: 'empresa123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));
    authServiceMock.isSessionExpired.mockResolvedValue(false);
    authServiceMock.isEmpresaAccount.mockResolvedValue(true);

    const result = TestBed.runInInjectionContext(() =>
      empresaGuard({} as any, { url: '/empresas/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(guardResult).toBe(true);
  });

  it('deve deslogar e redirecionar se o usuário autenticado não for uma empresa', async () => {
    const mockUser = { uid: 'usuario_b2c' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));
    authServiceMock.isSessionExpired.mockResolvedValue(false);
    authServiceMock.isEmpresaAccount.mockResolvedValue(false);

    const result = TestBed.runInInjectionContext(() =>
      empresaGuard({} as any, { url: '/empresas/dashboard' } as any)
    );

    await firstValueFrom(result as Observable<any>);
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/empresas/login'], {
      queryParams: { error: 'acesso_exclusivo' },
    });
  });
});
