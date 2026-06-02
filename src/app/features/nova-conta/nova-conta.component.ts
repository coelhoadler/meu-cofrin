import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { Conta, ContaService } from '../../core/services/conta.service';

@Component({
  selector: 'app-nova-conta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NgxMaskDirective],
  templateUrl: './nova-conta.component.html'
})
export class NovaContaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contaService = inject(ContaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
  
  isEditMode = signal(false);
  editId = signal<string | null>(null);
  existingReciboUrl = signal<string | null>(null);

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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editId.set(id);
      this.isLoading.set(true);
      try {
        const conta = await this.contaService.getContaById(id);
        if (conta) {
          // Pre-fill the form
          this.contaForm.patchValue({
            nome: conta.nome,
            descricao: conta.descricao || '',
            tipo: conta.tipo,
            categoria: conta.categoria,
            diaVencimento: conta.diaVencimento,
            statusPago: conta.statusPago,
            dataPagamento: conta.dataPagamento || '',
            valor: conta.valor?.toString() || ''
          });
          if (conta.reciboUrl) {
            this.existingReciboUrl.set(conta.reciboUrl);
          }
        } else {
          this.errorMessage.set('Conta não encontrada.');
        }
      } catch (error) {
        console.error('Erro ao buscar conta:', error);
        this.errorMessage.set('Erro ao carregar dados da conta.');
      } finally {
        this.isLoading.set(false);
      }
    }
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

      if (this.isEditMode() && this.editId()) {
        await this.contaService.updateConta(this.editId()!, contaData, this.selectedFile());
      } else {
        await this.contaService.addConta(contaData, this.selectedFile());
      }
      
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Erro ao salvar a conta. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
