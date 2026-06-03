import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent {
  private fb = inject(FormBuilder);

  categoriaForm = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    tipo: ['Despesa', [Validators.required]],
    cor: ['#1a112c']
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Aqui seria feita a chamada para o serviço de categorias
    setTimeout(() => {
      this.isLoading.set(false);
      // Mock de sucesso:
      this.categoriaForm.reset({ tipo: 'Despesa', cor: '#8b5cf6' });
      // Se fosse redirecionar, faríamos algo como this.router.navigate(['/dashboard'])
    }, 800);
  }
}
