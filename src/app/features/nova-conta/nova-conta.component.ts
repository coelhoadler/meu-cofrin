import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { Conta, ContaService } from '../../core/services/conta.service';
import { Categoria, CategoriaService } from '../../core/services/categoria.service';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-nova-conta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, NgxMaskDirective, DatePickerModule, CheckboxModule, SelectModule],
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
    mesReferencia: [new Date(), [Validators.required]],
    diaVencimento: [new Date().getDate(), [Validators.required, Validators.min(1), Validators.max(31)]],
    statusPago: [false],
    isRecorrente: [false],
    dataPagamento: [{ value: null as any, disabled: true }],
    valor: ['', [Validators.required]]
  });

  selectedFile = signal<File | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  isEditMode = signal(false);
  editId = signal<string | null>(null);
  existingReciboUrl = signal<string | null>(null);
  returnUrl = signal<string>('/dashboard');
  
  valorAntigo = signal<number | null>(null);
  currentValorNum = signal<number>(0);

  diferencaValor = computed(() => {
    const antigo = this.valorAntigo();
    if (antigo === null) return null;
    
    const atual = this.currentValorNum();
    const diff = atual - antigo;
    
    if (diff === 0) return null;
    
    const tipo = this.contaForm.get('tipo')?.value || 'Despesa';
    
    let isPositiveChange = false;
    if (tipo === 'Despesa') {
      // Para despesa, aumento é ruim (isPositiveChange = false)
      isPositiveChange = diff < 0;
    } else {
      // Para receita, aumento é bom
      isPositiveChange = diff > 0;
    }
    
    return {
      valorAbsoluto: Math.abs(diff),
      isAumento: diff > 0,
      isPositiveChange
    };
  });

  categorias = signal<Categoria[]>([]);
  categoriasOptions = computed(() => this.categorias().map(cat => ({
    ...cat,
    label: `${cat.nome} (${cat.tipo})`
  })));

  constructor() {
    // Listen to valor
    this.contaForm.get('valor')?.valueChanges.subscribe(v => {
      this.currentValorNum.set(this.parseFloatValor(v));
    });

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
        dataPagamentoCtrl?.setValue(null, { emitEvent: false });
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
        if (!dataPagamentoCtrl?.value) {
          dataPagamentoCtrl?.setValue(new Date());
        }
      } else {
        dataPagamentoCtrl?.disable();
        dataPagamentoCtrl?.clearValidators();
        dataPagamentoCtrl?.setValue(null);
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

      const from = this.route.snapshot.queryParamMap.get('from');
      if (from === 'lancamentos') {
        this.returnUrl.set('/lancamentos');
      }

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

          let mesRefDate = new Date();
          if (conta.mesReferencia) {
            const [y, m] = conta.mesReferencia.split('-');
            mesRefDate = new Date(parseInt(y), parseInt(m) - 1, 1);
          }

          let dataPagDate = null;
          if (conta.dataPagamento) {
            const [y, m, d] = conta.dataPagamento.split('-');
            dataPagDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          }

          this.contaForm.patchValue({
            nome: conta.nome,
            descricao: conta.descricao || '',
            categoriaId: catIdToSelect,
            tipo: conta.tipo,
            mesReferencia: mesRefDate as any,
            diaVencimento: conta.diaVencimento,
            statusPago: conta.statusPago,
            isRecorrente: conta.isRecorrente || false,
            dataPagamento: dataPagDate as any,
            valor: conta.valor?.toString().replace('.', '')
          });

          if (conta.valorAntigo) {
            this.valorAntigo.set(this.parseFloatValor(conta.valorAntigo));
          }

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

      let formattedMesRef = '';
      if (formValue.mesReferencia instanceof Date) {
        formattedMesRef = `${formValue.mesReferencia.getFullYear()}-${String(formValue.mesReferencia.getMonth() + 1).padStart(2, '0')}`;
      } else {
        formattedMesRef = formValue.mesReferencia as any;
      }

      let formattedDataPag = '';
      if (formValue.dataPagamento instanceof Date) {
        formattedDataPag = `${formValue.dataPagamento.getFullYear()}-${String(formValue.dataPagamento.getMonth() + 1).padStart(2, '0')}-${String(formValue.dataPagamento.getDate()).padStart(2, '0')}`;
      } else if (formValue.dataPagamento) {
        formattedDataPag = formValue.dataPagamento as any;
      }

      const contaData: any = {
        ...formValue,
        mesReferencia: formattedMesRef,
        dataPagamento: formattedDataPag,
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

      this.router.navigate([this.returnUrl()]);
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
        this.router.navigate([this.returnUrl()]);
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

  parseFloatValor(valor: any): number {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    const str = String(valor);
    const cleanValue = str.replace(/\./g, '').replace(',', '.').replace('R$', '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
}
