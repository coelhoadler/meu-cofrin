import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { EmpresasLoginComponent } from './empresas-login.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

describe('EmpresasLoginComponent', () => {
  let component: EmpresasLoginComponent;
  let fixture: ComponentFixture<EmpresasLoginComponent>;
  let authServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();

    authServiceMock = {
      login: vi.fn().mockResolvedValue({
        user: { uid: 'company_uid_123' },
      }),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(doc).mockReturnValue({} as any);

    await TestBed.configureTestingModule({
      imports: [EmpresasLoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Firestore, useValue: {} },
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

    fixture = TestBed.createComponent(EmpresasLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('deve inicializar com formulário inválido', () => {
    expect(component.form.valid).toBe(false);
  });

  it('deve validar formulário quando e-mail e senha forem válidos', () => {
    component.form.patchValue({
      email: 'contato@empresa.com.br',
      senha: 'password123',
    });

    expect(component.form.valid).toBe(true);
  });

  it('deve navegar para dashboard corporativo quando a empresa existir na coleção companies', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ nomeFantasia: 'Empresa Teste LTDA' }),
    } as any);

    component.form.patchValue({
      email: 'contato@empresa.com.br',
      senha: 'password123',
    });

    await component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('contato@empresa.com.br', 'password123');
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'companies/company_uid_123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/empresas/dashboard');
  });

  it('deve deslogar e exibir mensagem quando o usuário não tiver cadastro corporativo em companies', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any);

    component.form.patchValue({
      email: 'usuario@pessoal.com',
      senha: 'password123',
    });

    await component.onSubmit();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.errorMessage()).toContain('exclusivo para contas corporativas');
  });

  it('deve exibir mensagem de erro amigável em credenciais inválidas', async () => {
    authServiceMock.login.mockRejectedValue({ code: 'auth/invalid-credential' });

    component.form.patchValue({
      email: 'contato@empresa.com.br',
      senha: 'wrongpassword',
    });

    await component.onSubmit();

    expect(component.errorMessage()).toContain('Credenciais inválidas');
  });
});
