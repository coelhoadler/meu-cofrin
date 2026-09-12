import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { WebauthnService } from '../../core/auth/webauthn.service';
import { LoginComponent } from './login.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LoginComponent (Área Pessoal)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let webauthnServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();

    authServiceMock = {
      login: vi.fn().mockResolvedValue({
        user: { uid: 'user_pessoal_123' },
      }),
      signup: vi.fn().mockResolvedValue({
        user: { uid: 'user_pessoal_123' },
      }),
      loginWithGoogle: vi.fn().mockResolvedValue({
        user: { uid: 'user_pessoal_123' },
      }),
      logout: vi.fn().mockResolvedValue(undefined),
      isEmpresaAccount: vi.fn().mockResolvedValue(false),
      currentUser: signal(null),
      getCurrentUserAsync: vi.fn().mockResolvedValue(null),
    };

    webauthnServiceMock = {
      isAvailable: vi.fn().mockResolvedValue(false),
      authenticateWithPasskey: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: WebauthnService, useValue: webauthnServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('deve permitir login de conta pessoal comum', async () => {
    component.isLoginMode.set(true);
    component.loginStep.set(2);
    component.loginForm.patchValue({
      email: 'usuario@pessoal.com',
      password: 'mypassword123',
    });

    await component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('usuario@pessoal.com', 'mypassword123');
    expect(authServiceMock.isEmpresaAccount).toHaveBeenCalledWith('user_pessoal_123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('deve bloquear login de conta corporativa e exibir mensagem amigável', async () => {
    authServiceMock.isEmpresaAccount.mockResolvedValue(true);

    component.isLoginMode.set(true);
    component.loginStep.set(2);
    component.loginForm.patchValue({
      email: 'empresa@corp.com',
      password: 'corppassword',
    });

    await component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('empresa@corp.com', 'corppassword');
    expect(authServiceMock.isEmpresaAccount).toHaveBeenCalledWith('user_pessoal_123');
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Esta conta é corporativa');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('deve bloquear login com Google de conta corporativa', async () => {
    authServiceMock.isEmpresaAccount.mockResolvedValue(true);

    await component.loginWithGoogle();

    expect(authServiceMock.loginWithGoogle).toHaveBeenCalled();
    expect(authServiceMock.isEmpresaAccount).toHaveBeenCalledWith('user_pessoal_123');
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Esta conta é corporativa');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('deve bloquear login biométrico de conta corporativa', async () => {
    authServiceMock.isEmpresaAccount.mockResolvedValue(true);
    authServiceMock.getCurrentUserAsync.mockResolvedValue({ uid: 'user_pessoal_123' });
    component.loginForm.patchValue({ email: 'empresa@corp.com' });

    await component.loginWithBiometrics();

    expect(webauthnServiceMock.authenticateWithPasskey).toHaveBeenCalledWith('empresa@corp.com');
    expect(authServiceMock.isEmpresaAccount).toHaveBeenCalledWith('user_pessoal_123');
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Esta conta é corporativa');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
