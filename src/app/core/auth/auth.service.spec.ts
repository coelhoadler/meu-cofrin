import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UserDataService } from '../services/user-data.service';
import { EmpresaService } from '../../features/empresas/services/empresa.service';

vi.mock('@angular/fire/auth', () => ({
  Auth: vi.fn(),
  authState: vi.fn(),
}));

describe('AuthService - LastAccessAt bypass corporativo', () => {
  let service: AuthService;
  let authMock: any;
  let routerMock: any;
  let userDataServiceMock: any;
  let empresaServiceMock: any;

  beforeEach(() => {
    authMock = {};
    routerMock = {
      url: '/dashboard',
      navigate: vi.fn(),
    };
    userDataServiceMock = {
      updateLastAccessDate: vi.fn().mockResolvedValue(undefined),
      saveUserProfile: vi.fn().mockResolvedValue(undefined),
    };
    empresaServiceMock = {
      isEmpresaAccount: vi.fn().mockResolvedValue(false),
    };

    vi.mocked(authState).mockReturnValue(of(null));
  });

  const createService = () => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: UserDataService, useValue: userDataServiceMock },
        { provide: EmpresaService, useValue: empresaServiceMock },
      ],
    });
    return TestBed.inject(AuthService);
  };

  it('não deve atualizar lastAccessAt quando a rota for corporativa (/empresas)', async () => {
    routerMock.url = '/empresas/dashboard';
    const mockUser = { uid: 'empresa_123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));

    service = createService();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(userDataServiceMock.updateLastAccessDate).not.toHaveBeenCalled();
  });

  it('não deve atualizar lastAccessAt quando o usuário for uma conta corporativa', async () => {
    routerMock.url = '/dashboard';
    empresaServiceMock.isEmpresaAccount.mockResolvedValue(true);
    const mockUser = { uid: 'empresa_123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));

    service = createService();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(userDataServiceMock.updateLastAccessDate).not.toHaveBeenCalled();
  });

  it('deve atualizar lastAccessAt para usuário pessoal em rotas pessoais', async () => {
    routerMock.url = '/dashboard';
    empresaServiceMock.isEmpresaAccount.mockResolvedValue(false);
    const mockUser = { uid: 'user_pessoal_123' };
    vi.mocked(authState).mockReturnValue(of(mockUser as any));

    service = createService();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(userDataServiceMock.updateLastAccessDate).toHaveBeenCalledWith('user_pessoal_123');
  });
});
