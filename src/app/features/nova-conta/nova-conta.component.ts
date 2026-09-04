import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
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
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    NgxMaskDirective,
    DatePickerModule,
    CheckboxModule,
    SelectModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './nova-conta.component.html',
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
    dataVencimento: [new Date(), [Validators.required]],
    statusPago: [false],
    isRecorrente: [false],
    dataPagamento: [null as any],
    valor: ['', [Validators.required]],
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

  isParcelado = signal(false);
  parcelamentoIdEdit = signal<string | null>(null);
  quantidadeParcelas = signal(1);
  parcelas = signal<{numero: number, dataVencimento: Date, valor: number, valorStr: string, isLocked: boolean, isPago: boolean, id?: string}[]>([]);

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
      isPositiveChange,
    };
  });

  categorias = signal<Categoria[]>([]);
  categoriasOptions = computed(() =>
    this.categorias().map((cat) => ({
      ...cat,
      label: `${cat.nome} (${cat.tipo})`,
    })),
  );

  constructor() {
    // Listen to valor
    this.contaForm.get('valor')?.valueChanges.subscribe((v) => {
      this.currentValorNum.set(this.parseFloatValor(v));
      if (this.isParcelado() && !this.isEditMode()) {
         this.gerarParcelas();
      } else if (this.isParcelado() && this.isEditMode()) {
         this.recalcularParcelas();
      }
    });

    // Listen to categoriaId to update tipo
    this.contaForm.get('categoriaId')?.valueChanges.subscribe((catId) => {
      const selectedCat = this.categorias().find((c) => c.id === catId);
      if (selectedCat) {
        this.contaForm.get('tipo')?.setValue(selectedCat.tipo);
      }
    });

    // Listen to tipo to handle validations
    this.contaForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      const statusPagoCtrl = this.contaForm.get('statusPago');
      const dataPagamentoCtrl = this.contaForm.get('dataPagamento');

      if (tipo === 'Receita') {
        statusPagoCtrl?.setValue(false, { emitEvent: false });
        dataPagamentoCtrl?.setValue(null, { emitEvent: false });
      }
    });

    // Listen to statusPago to manage dataPagamento
    this.contaForm.get('statusPago')?.valueChanges.subscribe((isPaid) => {
      if (this.contaForm.get('tipo')?.value === 'Receita') return;

      const dataPagamentoCtrl = this.contaForm.get('dataPagamento');
      if (isPaid) {
        if (!dataPagamentoCtrl?.value) {
          dataPagamentoCtrl?.setValue(new Date());
        }
      } else {
        dataPagamentoCtrl?.setValue(null);
      }
    });
  }

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      // Load categories first
      const cats = await this.categoriaService.getCategorias();
      this.categorias.set(cats.sort((a, b) => a.nome.localeCompare(b.nome)));

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
            const matchedCat = cats.find((c) => c.nome === conta.categoria);
            if (matchedCat) {
              catIdToSelect = matchedCat.id!;
            }
          }

          let vencimentoDate = new Date();
          if (conta.mesReferencia && conta.diaVencimento) {
            const [y, m] = conta.mesReferencia.split('-');
            vencimentoDate = new Date(parseInt(y), parseInt(m) - 1, conta.diaVencimento);
          } else if (conta.mesReferencia) {
            const [y, m] = conta.mesReferencia.split('-');
            vencimentoDate = new Date(parseInt(y), parseInt(m) - 1, 1);
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
            dataVencimento: vencimentoDate as any,
            statusPago: conta.statusPago,
            isRecorrente: conta.isRecorrente || false,
            dataPagamento: dataPagDate as any,
            valor: conta.valor?.toString().replace('.', ''),
          });

          if (conta.valorAntigo) {
            this.valorAntigo.set(this.parseFloatValor(conta.valorAntigo));
          }

          if (conta.reciboUrl) {
            this.existingReciboUrl.set(conta.reciboUrl);
          }

          if (conta.parcelamentoId) {
            this.isParcelado.set(true);
            this.parcelamentoIdEdit.set(conta.parcelamentoId);
            this.contaForm.get('isRecorrente')?.disable();

            const pacs = await this.contaService.getContasByParcelamentoId(conta.parcelamentoId);
            this.quantidadeParcelas.set(pacs.length);

            const arr = pacs.map(p => {
              let pVencDate = new Date();
              if (p.mesReferencia && p.diaVencimento) {
                const [y, m] = p.mesReferencia.split('-');
                pVencDate = new Date(parseInt(y), parseInt(m) - 1, p.diaVencimento);
              }
              const pValor = this.parseFloatValor(p.valor);
              return {
                id: p.id,
                numero: p.numeroParcela || 1,
                dataVencimento: pVencDate,
                valor: pValor,
                valorStr: pValor.toFixed(2).replace('.', ','),
                isLocked: p.statusPago,
                isPago: p.statusPago
              };
            });
            this.parcelas.set(arr);
            
            // Re-sync o valor total (soma das parcelas) caso divirja por arredondamento
            const soma = arr.reduce((acc, p) => acc + p.valor, 0);
            this.contaForm.get('valor')?.setValue(soma.toFixed(2).replace('.', ','), {emitEvent: false});
            this.currentValorNum.set(soma);
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
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
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

    if (this.isParcelado()) {
      const sum = this.parcelas().reduce((acc, p) => acc + p.valor, 0);
      if (Math.abs(sum - this.currentValorNum()) > 0.05) {
         this.errorMessage.set('A soma das parcelas não bate com o valor total! Ajuste os valores.');
         return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.contaForm.getRawValue();
      const selectedCat = this.categorias().find((c) => c.id === formValue.categoriaId);

      let formattedMesRef = '';
      let diaVenc = new Date().getDate();

      if (formValue.dataVencimento instanceof Date) {
        const d = formValue.dataVencimento;
        diaVenc = d.getDate();
        formattedMesRef = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (formValue.dataVencimento) {
        const d = new Date(formValue.dataVencimento);
        if (!isNaN(d.getTime())) {
          diaVenc = d.getDate();
          formattedMesRef = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      let formattedDataPag: string | null = null;
      if (formValue.statusPago) {
        if (formValue.dataPagamento instanceof Date) {
          formattedDataPag = `${formValue.dataPagamento.getFullYear()}-${String(formValue.dataPagamento.getMonth() + 1).padStart(2, '0')}-${String(formValue.dataPagamento.getDate()).padStart(2, '0')}`;
        } else if (typeof formValue.dataPagamento === 'string' && formValue.dataPagamento) {
          formattedDataPag = formValue.dataPagamento;
        } else {
          const hoje = new Date();
          formattedDataPag = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        }
      }

      const contaData: any = {
        ...formValue,
        mesReferencia: formattedMesRef,
        diaVencimento: diaVenc,
        dataPagamento: formattedDataPag,
        categoria: selectedCat?.nome || '',
        tipo: selectedCat?.tipo || 'Despesa',
        valor: formValue.valor,
      };

      delete contaData.categoriaId;
      delete contaData.dataVencimento;

      if (this.isParcelado() && this.parcelas().length > 0) {
        const pId = this.parcelamentoIdEdit() || `parc_${Date.now()}`;
        const parcelasParaSalvar = this.parcelas().map(p => {
          const d = p.dataVencimento;
          const diaVenc = d.getDate();
          const formattedMesRef = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          
          return {
            ...contaData,
            id: p.id,
            nome: `${formValue.nome} (${p.numero}/${this.parcelas().length})`,
            mesReferencia: formattedMesRef,
            diaVencimento: diaVenc,
            statusPago: p.isPago,
            isRecorrente: false,
            valor: p.valorStr,
            parcelamentoId: pId,
            numeroParcela: p.numero,
            totalParcelas: this.parcelas().length,
            // Mantém a data de pagamento se já estiver pago, senão anula p/ as não pagas
            dataPagamento: p.isPago ? contaData.dataPagamento : null
          };
        });

        if (this.isEditMode() && this.parcelamentoIdEdit()) {
           await this.contaService.updateContasParceladas(parcelasParaSalvar as any, this.selectedFile());
        } else {
           await this.contaService.addContasParceladas(parcelasParaSalvar as any, this.selectedFile());
        }
      } else {
        if (this.isEditMode() && this.editId()) {
          await this.contaService.updateConta(this.editId()!, contaData, this.selectedFile());
        } else {
          await this.contaService.addConta(contaData, this.selectedFile());
        }
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

  desmarcarComoPaga() {
    this.contaForm.get('statusPago')?.setValue(false);
  }

  marcarComoPaga() {
    this.contaForm.get('statusPago')?.setValue(true);
  }

  parseFloatValor(valor: any): number {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    const str = String(valor);
    const cleanValue = str.replace(/\./g, '').replace(',', '.').replace('R$', '').replace(/\s/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }

  gerarParcelas() {
    const total = this.currentValorNum();
    const qtd = this.quantidadeParcelas();
    if (!total || qtd <= 1) {
      this.parcelas.set([]);
      return;
    }

    const valorBase = Math.floor((total / qtd) * 100) / 100;
    let diff = total - (valorBase * qtd);
    diff = Math.round(diff * 100) / 100;

    const arr = [];
    const baseDate = this.contaForm.get('dataVencimento')?.value || new Date();
    
    for (let i = 1; i <= qtd; i++) {
      let v = valorBase;
      if (i === 1) {
        v += diff;
      }
      v = Math.round(v * 100) / 100;
      
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));

      arr.push({
        numero: i,
        dataVencimento: d,
        valor: v,
        valorStr: v.toFixed(2).replace('.', ','),
        isLocked: false,
        isPago: false
      });
    }
    this.parcelas.set(arr);
  }

  recalcularParcelas() {
    const total = this.currentValorNum();
    const arr = [...this.parcelas()];
    
    const fixedParcels = arr.filter(p => p.isLocked || p.isPago);
    const sumFixed = fixedParcels.reduce((acc, p) => acc + p.valor, 0);
    
    const remainingToDistribute = total - sumFixed;
    const flexibleParcels = arr.filter(p => !p.isLocked && !p.isPago);
    
    if (flexibleParcels.length > 0) {
      const valorBase = Math.floor((remainingToDistribute / flexibleParcels.length) * 100) / 100;
      let diff = remainingToDistribute - (valorBase * flexibleParcels.length);
      diff = Math.round(diff * 100) / 100;

      flexibleParcels.forEach((p, index) => {
        p.valor = valorBase + (index === 0 ? diff : 0);
        p.valor = Math.round(p.valor * 100) / 100;
        p.valorStr = p.valor.toFixed(2).replace('.', ',');
      });
      this.errorMessage.set(null);
    } else {
      const diffTotal = total - sumFixed;
      if (Math.abs(diffTotal) > 0.05) {
        this.errorMessage.set(`A soma das parcelas (R$ ${sumFixed.toFixed(2)}) diverge do total (R$ ${total.toFixed(2)}). Faltam R$ ${diffTotal.toFixed(2)}.`);
      } else {
         this.errorMessage.set(null);
      }
    }
    this.parcelas.set(arr);
  }

  onParcelaValorBlur(index: number, event: any) {
    const newValStr = event.target.value;
    const val = this.parseFloatValor(newValStr);
    const arr = [...this.parcelas()];
    arr[index].valor = val;
    arr[index].valorStr = val.toFixed(2).replace('.', ',');
    arr[index].isLocked = true;
    this.parcelas.set(arr);
    this.recalcularParcelas();
  }

  onParcelaDateChange(index: number, newDate: Date) {
    if (newDate) {
      const arr = [...this.parcelas()];
      arr[index].dataVencimento = newDate;
      this.parcelas.set(arr);
    }
  }

  toggleParcelamento(event: any) {
    const checked = event.checked;
    this.isParcelado.set(checked);
    if (checked) {
      this.contaForm.get('isRecorrente')?.setValue(false);
      this.contaForm.get('isRecorrente')?.disable();
      if (this.parcelas().length === 0) {
        this.quantidadeParcelas.set(2);
        this.gerarParcelas();
      }
    } else {
      this.contaForm.get('isRecorrente')?.enable();
      this.parcelas.set([]);
    }
  }

  onQtdParcelasChange(event: any) {
    this.quantidadeParcelas.set(parseInt(event.target.value, 10));
    this.gerarParcelas();
  }
}
