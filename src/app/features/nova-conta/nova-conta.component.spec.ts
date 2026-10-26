import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NovaContaComponent } from './nova-conta.component';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';

vi.mock('ngx-mask', () => ({
  NgxMaskDirective: vi.fn(),
  provideNgxMask: vi.fn(() => []),
}));

describe('NovaContaComponent', () => {
  let component: NovaContaComponent;
  let fixture: ComponentFixture<NovaContaComponent>;
  let contaServiceMock: any;
  let categoriaServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let navigationHistoryMock: any;

  beforeEach(async () => {
    contaServiceMock = {
      addConta: vi.fn().mockResolvedValue(undefined),
      updateConta: vi.fn().mockResolvedValue(undefined),
      deleteConta: vi.fn().mockResolvedValue(undefined),
      getContaById: vi.fn().mockResolvedValue({
        id: '123',
        nome: 'Conta Teste',
        valor: 100,
        categoria: 'Alimentação',
        tipo: 'Despesa',
        dataVencimento: '2023-12-01',
        mesReferencia: '2023-12',
        statusPago: false
      })
    };

    categoriaServiceMock = {
      getCategorias: vi.fn().mockResolvedValue([{ id: 'cat1', nome: 'Alimentação', tipo: 'Despesa' }])
    };

    routerMock = {
      navigate: vi.fn()
    };

    activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        },
        queryParamMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    navigationHistoryMock = {
      getPreviousUrl: vi.fn().mockReturnValue('/dashboard'),
      previousRoute: vi.fn().mockReturnValue('/dashboard')
    };

    await TestBed.configureTestingModule({
      imports: [NovaContaComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ContaService, useValue: contaServiceMock },
        { provide: CategoriaService, useValue: categoriaServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: NavigationHistoryService, useValue: navigationHistoryMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NovaContaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve instanciar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar categorias no init', async () => {
    await fixture.whenStable();
    expect(categoriaServiceMock.getCategorias).toHaveBeenCalled();
    expect(component.categorias().length).toBeGreaterThan(0);
    expect(component.categorias()[0].nome).toBe('Alimentação');
  });

  it('deve submeter o formulário quando válido', async () => {
    component.contaForm.patchValue({
      nome: 'Conta Nova',
      categoriaId: 'cat1',
      tipo: 'Despesa',
      dataVencimento: new Date('2023-12-10T00:00:00'),
      valor: '150.50'
    });

    await component.onSubmit();

    expect(contaServiceMock.addConta).toHaveBeenCalled();
    const args = contaServiceMock.addConta.mock.calls[0][0];
    expect(args.nome).toBe('Conta Nova');
    expect(args.valor).toBe('150.50');
    expect(args.categoria).toBe('Alimentação');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('não deve submeter o formulário quando inválido', async () => {
    component.contaForm.patchValue({
      nome: '',
      valor: null
    });

    await component.onSubmit();

    expect(contaServiceMock.addConta).not.toHaveBeenCalled();
    expect(component.contaForm.invalid).toBe(true);
  });
});
