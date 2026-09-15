import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DesejosComponent } from './desejos.component';
import { DesejoService } from '../../core/services/desejo.service';
import { Desejo } from '../../core/models/desejo.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DesejosComponent', () => {
  let component: DesejosComponent;
  let fixture: ComponentFixture<DesejosComponent>;

  const mockDesejos: Desejo[] = [
    {
      id: '1',
      nome: 'PlayStation 5',
      descricao: 'Console Sony',
      categoria: 'Vídeo game',
      menorPreco: 3500,
      maiorPreco: 4200,
      links: [
        { id: 'l1', url: 'https://amazon.com.br', loja: 'Amazon', preco: 3500 },
        { id: 'l2', url: 'https://magazineluiza.com.br', loja: 'Magalu', preco: 4200 }
      ]
    },
    {
      id: '2',
      nome: 'iPhone 15',
      descricao: 'Celular Apple 128GB',
      categoria: 'Celular',
      menorPreco: 4800,
      maiorPreco: 4800,
      links: [
        { id: 'l3', url: 'https://mercadolivre.com.br', loja: 'Mercado Livre', preco: 4800 }
      ]
    },
    {
      id: '3',
      nome: 'Cafeteira Expresso',
      descricao: 'Casa e cozinha',
      categoria: 'Casa',
      menorPreco: null,
      maiorPreco: null,
      links: []
    }
  ];

  const mockDesejoService = {
    getDesejos: vi.fn().mockImplementation(() => Promise.resolve(mockDesejos.map(d => ({ ...d })))),
    addDesejo: vi.fn().mockResolvedValue('new-id'),
    updateDesejo: vi.fn().mockResolvedValue(undefined),
    deleteDesejo: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DesejosComponent],
      providers: [
        provideRouter([]),
        { provide: DesejoService, useValue: mockDesejoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DesejosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve instanciar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar a lista de desejos no ngOnInit', async () => {
    await component.loadDesejos();
    expect(component.desejos().length).toBe(3);
    expect(component.desejosFiltrados().length).toBe(3);
  });

  it('deve filtrar os produtos por texto de busca', async () => {
    await component.loadDesejos();

    component.filtroTexto.set('PlayStation');
    expect(component.desejosFiltrados().length).toBe(1);
    expect(component.desejosFiltrados()[0].nome).toBe('PlayStation 5');

    component.filtroTexto.set('apple');
    expect(component.desejosFiltrados().length).toBe(1);
    expect(component.desejosFiltrados()[0].nome).toBe('iPhone 15');

    component.filtroTexto.set('inexistente');
    expect(component.desejosFiltrados().length).toBe(0);
  });

  it('deve filtrar os produtos por categoria selecionada', async () => {
    await component.loadDesejos();

    component.setCategoria('Celular');
    expect(component.desejosFiltrados().length).toBe(1);
    expect(component.desejosFiltrados()[0].categoria).toBe('Celular');

    component.setCategoria('Casa');
    expect(component.desejosFiltrados().length).toBe(1);
    expect(component.desejosFiltrados()[0].categoria).toBe('Casa');

    component.setCategoria('Todas');
    expect(component.desejosFiltrados().length).toBe(3);
  });

  it('deve formatar corretamente a exibição da faixa de preço', () => {
    const d1 = mockDesejos[0]; // 3500 - 4200
    const d2 = mockDesejos[1]; // 4800
    const d3 = mockDesejos[2]; // sem preços

    component.showValues.set(true);
    expect(component.formatPrecoDisplay(d1)).toContain('R$');
    expect(component.formatPrecoDisplay(d1)).toContain('-');

    expect(component.formatPrecoDisplay(d2)).toContain('R$');
    expect(component.formatPrecoDisplay(d2)).not.toContain('-');

    expect(component.formatPrecoDisplay(d3)).toBe('Sem preços registrados');

    component.showValues.set(false);
    expect(component.formatPrecoDisplay(d1)).toBe('R$ •••••');
  });

  it('deve abrir e fechar o modal de novo desejo corretamente', () => {
    component.openNewModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);

    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });
});
