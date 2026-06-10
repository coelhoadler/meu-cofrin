import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { Conta, ContaService } from '../../core/services/conta.service';
import { Categoria, CategoriaService } from '../../core/services/categoria.service';

@Component({
  selector: 'app-nova-conta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NgxMaskDirective],
  templateUrl: './nova-conta.component.html'
})
export class NovaContaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contaService = inject(ContaService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  contaForm = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    categoriaId: ['', [Validators.required]],
    tipo: ['Despesa', [Validators.required]],
    mesReferencia: [new Date().toISOString().slice(0, 7), [Validators.required]],
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

  categorias = signal<Categoria[]>([]);

  constructor() {
    // Listen to categoriaId to update tipo
    this.contaForm.get('categoriaId')?.valueChanges.subscribe(catId => {
      const selectedCat = this.categorias().find(c => c.id === catId);
      if (selectedCat) {
        this.contaForm.get('tipo')?.setValue(selectedCat.tipo);
      }
    });

    // Listen to tipo to handle validations
    this.contaForm.get('tipo')?.valueChanges.subscribe(tipo => {
      const statusPagoCtrl = this.contaForm.get('statusPago');
      const dataPagamentoCtrl = this.contaForm.get('dataPagamento');

      if (tipo === 'Receita') {
        statusPagoCtrl?.setValue(false, { emitEvent: false });
        dataPagamentoCtrl?.disable({ emitEvent: false });
        dataPagamentoCtrl?.clearValidators();
        dataPagamentoCtrl?.setValue('', { emitEvent: false });
      } else {
        if (statusPagoCtrl?.value) {
          dataPagamentoCtrl?.enable({ emitEvent: false });
          dataPagamentoCtrl?.setValidators([Validators.required]);
        } else {
          dataPagamentoCtrl?.disable({ emitEvent: false });
          dataPagamentoCtrl?.clearValidators();
        }
      }
      dataPagamentoCtrl?.updateValueAndValidity({ emitEvent: false });
    });

    // Listen to statusPago to enable/disable dataPagamento
    this.contaForm.get('statusPago')?.valueChanges.subscribe(isPaid => {
      if (this.contaForm.get('tipo')?.value === 'Receita') return;

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
    this.isLoading.set(true);
    try {
      // Load categories first
      const cats = await this.categoriaService.getCategorias();
      this.categorias.set(cats);

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.editId.set(id);
        
        const conta = await this.contaService.getContaById(id);

        if (conta) {
          // Pre-fill the form
          let catIdToSelect = '';
          if (conta.categoria) {
             const matchedCat = cats.find(c => c.nome === conta.categoria);
             if (matchedCat) {
               catIdToSelect = matchedCat.id!;
             }
          }

          this.contaForm.patchValue({
            nome: conta.nome,
            descricao: conta.descricao || '',
            categoriaId: catIdToSelect,
            tipo: conta.tipo,
            mesReferencia: conta.mesReferencia,
            diaVencimento: conta.diaVencimento,
            statusPago: conta.statusPago,
            dataPagamento: conta.dataPagamento || '',
            valor: conta.valor?.toString().replace('.', '')
          });

          if (conta.reciboUrl) {
            this.existingReciboUrl.set(conta.reciboUrl);
          }
        } else {
          this.errorMessage.set('Conta não encontrada.');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      this.errorMessage.set('Erro ao carregar os dados.');
    } finally {
      this.isLoading.set(false);
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
      const selectedCat = this.categorias().find(c => c.id === formValue.categoriaId);

      const contaData: any = {
        ...formValue,
        categoria: selectedCat?.nome || '',
        tipo: selectedCat?.tipo || 'Despesa',
        valor: formValue.valor
      };
      
      delete contaData.categoriaId;

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

  async onDeleteConta() {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      this.isLoading.set(true);
      try {
        await this.contaService.deleteConta(this.editId()!);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        console.error(error);
        this.errorMessage.set('Erro ao excluir a conta.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  async onRemoveRecibo() {
    if (confirm('Tem certeza que deseja remover o anexo?')) {
      this.isLoading.set(true);
      try {
        await this.contaService.removeRecibo(this.editId()!);
        this.existingReciboUrl.set(null);
      } catch (error: any) {
        console.error(error);
        this.errorMessage.set('Erro ao remover o anexo.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
  }
}
