import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoriasComponent } from './categorias.component';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CategoriasComponent', () => {
  let component: CategoriasComponent;
  let fixture: ComponentFixture<CategoriasComponent>;

  const mockCategorias: Categoria[] = [
    { id: '1', nome: 'Alimentação', tipo: 'Despesa', icone: 'restaurant' },
    { id: '2', nome: 'Salário', tipo: 'Receita', icone: 'account_balance_wallet' },
    { id: '3', nome: 'Legado Sem Ícone', tipo: 'Despesa', cor: '#ff0000' },
  ];

  const mockCategoriaService = {
    getCategorias: vi.fn().mockImplementation(() => Promise.resolve(mockCategorias.map(c => ({ ...c })))),
    addCategoria: vi.fn().mockResolvedValue(undefined),
    updateCategoria: vi.fn().mockResolvedValue(undefined),
    deleteCategoria: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CategoriasComponent],
      providers: [
        provideRouter([]),
        { provide: CategoriaService, useValue: mockCategoriaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('T004 [US1] should load and render categories with icons and fallback', async () => {
    await component.loadCategorias();
    expect(component.categorias().length).toBe(3);
    expect(component.categorias()[0].icone).toBe('restaurant');
  });

  it('T008 [US2] should open new category modal and save with selected icon', async () => {
    component.openNewModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.selectedIcon()).toBe('sell');

    component.selectIcon('home');
    expect(component.selectedIcon()).toBe('home');

    component.categoriaForm.patchValue({ nome: 'Moradia', tipo: 'Despesa' });
    await component.onSubmit();

    expect(mockCategoriaService.addCategoria).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Moradia',
        tipo: 'Despesa',
        icone: 'home',
      })
    );
    expect(component.isModalOpen()).toBe(false);
  });

  it('T012 [US3] should open edit modal with current category data and update icon', async () => {
    const catToEdit = mockCategorias[0];
    component.openEditModal(catToEdit);

    expect(component.isModalOpen()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    expect(component.editId()).toBe('1');
    expect(component.selectedIcon()).toBe('restaurant');
    expect(component.categoriaForm.value.nome).toBe('Alimentação');

    component.selectIcon('coffee');
    await component.onSubmit();

    expect(mockCategoriaService.updateCategoria).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        nome: 'Alimentação',
        icone: 'coffee',
      })
    );
    expect(component.isModalOpen()).toBe(false);
  });

  it('T012 [US3] should fallback to default icon for legacy category in edit modal', () => {
    const legacyCat = mockCategorias[2];
    component.openEditModal(legacyCat);

    expect(component.selectedIcon()).toBe('sell');
  });

  it('T015 [US4] should delete category on confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await component.deleteCategoria('1');
    expect(mockCategoriaService.deleteCategoria).toHaveBeenCalledWith('1');
  });
});
