import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Categoria, CategoriaService, CATEGORIA_ICONS } from '../../core/services/categoria.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);

  readonly availableIcons = CATEGORIA_ICONS;
  readonly defaultIcon = 'sell';

  categoriaForm = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    tipo: ['Despesa', [Validators.required]],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  categorias = signal<Categoria[]>([]);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editId = signal<string | null>(null);
  selectedIcon = signal<string>(this.defaultIcon);

  ngOnInit() {
    this.loadCategorias();
  }

  async loadCategorias() {
    try {
      const raw = await this.categoriaService.getCategorias();
      const data = [...raw].sort((a, b) => a.nome.localeCompare(b.nome));
      this.categorias.set(data);
    } catch (error) {
      console.error('Erro ao carregar categorias', error);
    }
  }

  openNewModal() {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.selectedIcon.set(this.defaultIcon);
    this.categoriaForm.reset({ tipo: 'Despesa', nome: '', descricao: '' });
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(categoria: Categoria) {
    this.isEditMode.set(true);
    this.editId.set(categoria.id || null);
    this.selectedIcon.set(categoria.icone || this.defaultIcon);
    this.categoriaForm.patchValue({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      tipo: categoria.tipo || 'Despesa',
    });
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isEditMode.set(false);
    this.editId.set(null);
    this.selectedIcon.set(this.defaultIcon);
    this.categoriaForm.reset({ tipo: 'Despesa', nome: '', descricao: '' });
    this.errorMessage.set(null);
  }

  selectIcon(iconName: string) {
    this.selectedIcon.set(iconName);
  }

  async onSubmit() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.categoriaForm.value;
      const categoriaData: Categoria = {
        nome: formValue.nome!.trim(),
        descricao: formValue.descricao?.trim() || '',
        tipo: (formValue.tipo as 'Despesa' | 'Receita') || 'Despesa',
        icone: this.selectedIcon(),
      };

      if (this.isEditMode() && this.editId()) {
        await this.categoriaService.updateCategoria(this.editId()!, categoriaData);
      } else {
        await this.categoriaService.addCategoria(categoriaData);
      }

      this.closeModal();
      await this.loadCategorias();
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Erro ao salvar categoria. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteCategoria(id: string) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await this.categoriaService.deleteCategoria(id);
        await this.loadCategorias();
        if (this.isModalOpen() && this.editId() === id) {
          this.closeModal();
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir categoria.');
      }
    }
  }
}
