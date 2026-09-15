import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { AuthService } from '../../../core/auth/auth.service';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { EmpresasCadastroComponent } from './empresas-cadastro.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@angular/fire/auth', () => ({
  Auth: vi.fn(),
  fetchSignInMethodsForEmail: vi.fn(),
}));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue('TIMESTAMP_MOCK'),
}));

describe('EmpresasCadastroComponent', () => {
  let component: EmpresasCadastroComponent;
  let fixture: ComponentFixture<EmpresasCadastroComponent>;
  let authServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();

    authServiceMock = {
      signup: vi.fn().mockResolvedValue({
        user: { uid: 'company_uid_123' },
      }),
    };

    vi.mocked(fetchSignInMethodsForEmail).mockResolvedValue([]);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [EmpresasCadastroComponent],
      providers: [
        provideRouter([]),
        provideEnvironmentNgxMask(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpresasCadastroComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('deve inicializar o formulário inválido quando vazio', () => {
    expect(component.form.valid).toBe(false);
  });

  it('deve invalidar CNPJ com formato ou dígitos incorretos', () => {
    component.form.patchValue({
      nomeFantasia: 'Tech Corp',
      cnpj: '00000000000000',
      email: 'contato@techcorp.com',
      senha: 'password123',
    });

    expect(component.form.get('cnpj')?.valid).toBe(false);
    expect(component.form.get('cnpj')?.errors?.['cnpjInvalido']).toBe(true);
  });

  it('deve validar o formulário com dados corretos e CNPJ válido', () => {
    component.form.patchValue({
      nomeFantasia: 'Empresa Teste',
      cnpj: '11.222.333/0001-81',
      email: 'contato@empresa.com.br',
      senha: 'password123',
    });

    expect(component.form.valid).toBe(true);
  });

  it('deve realizar cadastro, salvar na coleção companies e navegar para dashboard', async () => {
    component.form.patchValue({
      nomeFantasia: 'Empresa Teste',
      cnpj: '11.222.333/0001-81',
      email: 'contato@empresa.com.br',
      senha: 'password123',
    });

    await component.onSubmit();

    expect(authServiceMock.signup).toHaveBeenCalledWith(
      'contato@empresa.com.br',
      'password123',
      'Empresa Teste'
    );
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'companies/company_uid_123');
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        nomeFantasia: 'Empresa Teste',
        cnpj: '11222333000181',
        email: 'contato@empresa.com.br',
        userId: 'company_uid_123',
      }),
      { merge: true }
    );
    expect(router.navigate).toHaveBeenCalledWith(['/empresas/dashboard']);
  });
});
