import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Categoria, CategoriaService } from '../../core/services/categoria.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);

  categoriaForm = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    tipo: ['Despesa', [Validators.required]],
    cor: ['#1a112c']
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  categorias = signal<Categoria[]>([]);
  isEditMode = signal(false);
  editId = signal<string | null>(null);

  ngOnInit() {
    this.loadCategorias();
  }

  async loadCategorias() {
    try {
      const data = (await this.categoriaService.getCategorias()).sort((a, b) => a.nome.localeCompare(b.nome));
      this.categorias.set(data);
    } catch (error) {
      console.error('Erro ao carregar categorias', error);
    }
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
        nome: formValue.nome!,
        descricao: formValue.descricao || '',
        tipo: formValue.tipo as 'Despesa' | 'Receita',
        cor: formValue.cor || ''
      };

      if (this.isEditMode() && this.editId()) {
        await this.categoriaService.updateCategoria(this.editId()!, categoriaData);
      } else {
        await this.categoriaService.addCategoria(categoriaData);
      }

      this.cancelEdit();
      await this.loadCategorias();
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Erro ao salvar categoria. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  editCategoria(categoria: Categoria) {
    this.isEditMode.set(true);
    this.editId.set(categoria.id!);
    this.categoriaForm.patchValue({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      tipo: categoria.tipo,
      cor: categoria.cor || '#1a112c'
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteCategoria(id: string) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await this.categoriaService.deleteCategoria(id);
        await this.loadCategorias();
        if (this.isEditMode() && this.editId() === id) {
          this.cancelEdit();
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir categoria.');
      }
    }
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.categoriaForm.reset({ tipo: 'Despesa', cor: '#1a112c' });
    this.errorMessage.set(null);
  }
}
