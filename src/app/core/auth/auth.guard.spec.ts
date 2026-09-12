import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { of, firstValueFrom, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

vi.mock('@angular/fire/auth', () => ({
  Auth: vi.fn(),
  authState: vi.fn(),
}));

describe('authGuard (Rotas Pessoais)', () => {
  let authMock: any;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authMock = {};
    authServiceMock = {
      isSessionExpired: vi.fn().mockResolvedValue(false),
      logout: vi.fn().mockResolvedValue(undefined),
      isEmpresaAccount: vi.fn().mockResolvedValue(false),
    };
    routerMock = {
      createUrlTree: vi.fn((commands, extras) => ({ commands, extras } as unknown as UrlTree)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('deve redirecionar para /login quando o usuário não estiver autenticado', async () => {
    vi.mocked(authState).mockReturnValue(of(null));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
    expect(guardResult).toEqual({
      commands: ['/login'],
      extras: { queryParams: { returnUrl: '/dashboard' } },
    });
  });

  it('deve permitir acesso (true) quando for um usuário pessoal válido', async () => {
    const mockUser = { uid: 'user_pessoal_123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));
    authServiceMock.isSessionExpired.mockResolvedValue(false);
    authServiceMock.isEmpresaAccount.mockResolvedValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(guardResult).toBe(true);
  });

  it('deve redirecionar empresas para /empresas/dashboard ao tentar acessar rotas pessoais', async () => {
    const mockUser = { uid: 'empresa_123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));
    authServiceMock.isSessionExpired.mockResolvedValue(false);
    authServiceMock.isEmpresaAccount.mockResolvedValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );

    const guardResult = await firstValueFrom(result as Observable<any>);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/empresas/dashboard']);
    expect(guardResult).toEqual({
      commands: ['/empresas/dashboard'],
      extras: undefined,
    });
  });
});
