import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { Conta, ContaService } from '../../core/services/conta.service';

@Component({
  selector: 'app-nova-conta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NgxMaskDirective],
  templateUrl: './nova-conta.component.html'
})
export class NovaContaComponent {
  private fb = inject(FormBuilder);
  private contaService = inject(ContaService);
  private router = inject(Router);

  contaForm = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    tipo: ['Despesa', [Validators.required]],
    categoria: ['', [Validators.required]],
    diaVencimento: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    statusPago: [false],
    dataPagamento: [{ value: '', disabled: true }],
    valor: ['', [Validators.required]]
  });

  selectedFile = signal<File | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    // Listen to statusPago to enable/disable dataPagamento
    this.contaForm.get('statusPago')?.valueChanges.subscribe(isPaid => {
      const dataPagamentoCtrl = this.contaForm.get('dataPagamento');
      if (isPaid) {
        dataPagamentoCtrl?.enable();
        dataPagamentoCtrl?.setValidators([Validators.required]);
      } else {
        dataPagamentoCtrl?.disable();
        dataPagamentoCtrl?.clearValidators();
        dataPagamentoCtrl?.setValue('');
      }
      dataPagamentoCtrl?.updateValueAndValidity();
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.errorMessage.set('O arquivo deve ter no máximo 5MB.');
        return;
      }
      this.selectedFile.set(file);
      this.errorMessage.set(null);
    }
  }

  async onSubmit() {
    if (this.contaForm.invalid) {
      this.contaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.contaForm.getRawValue();

      const contaData: any = {
        ...formValue,
        valor: formValue.valor
      };

      await this.contaService.addConta(contaData, this.selectedFile());
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Erro ao salvar a conta. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
