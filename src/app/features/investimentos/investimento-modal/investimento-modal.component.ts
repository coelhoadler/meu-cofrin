import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InvestimentoService } from '../../../core/services/investimento.service';
import { Investimento } from '../../../core/models/investimento.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-investimento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, NgxCurrencyDirective, NgxMaskDirective],
  templateUrl: './investimento-modal.component.html'
})
export class InvestimentoModalComponent implements OnInit {
  @Input() investimento: Investimento | null = null;
  @Output() closeModal = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private investimentoService = inject(InvestimentoService);

  visible = true;
  isLoading = false;
  form!: FormGroup;

  tipos = ['Ações', 'Cofrinhos', 'CDB', 'Criptomoedas', 'Fundos imobiliários', 'Fundos de investimento', 'Poupança', 'Tesouro Direto', 'Previdência privada', 'Outros'].sort((a: string, b: string) => a.localeCompare(b));
  instituicoes = ['Banco XP', 'Nubank', 'Itaú', 'Inter', 'Banco do Brasil', 'Rico', 'Outros'].sort((a: string, b: string) => a.localeCompare(b));

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(50)]],
      descricao: ['', [Validators.maxLength(200)]],
      tipo: ['CDB', Validators.required],
      dataVencimento: [null],
      instituicao: ['Nubank', Validators.required],
      instituicaoOutros: [''],
      aporteInicial: [0, [Validators.required, Validators.min(0)]]
    });

    // Listen changes to instituicao to handle Outros validation
    this.form.get('instituicao')?.valueChanges.subscribe(value => {
      const outrosControl = this.form.get('instituicaoOutros');
      if (value === 'Outros') {
        outrosControl?.setValidators([Validators.required]);
      } else {
        outrosControl?.clearValidators();
      }
      outrosControl?.updateValueAndValidity();
    });

    if (this.investimento) {
      // Edit mode
      this.form.patchValue({
        nome: this.investimento.nome,
        descricao: this.investimento.descricao,
        tipo: this.investimento.tipo,
        instituicao: this.investimento.instituicao,
        instituicaoOutros: this.investimento.instituicaoOutros || '',
        aporteInicial: this.investimento.aporteInicial
      });

      if (this.investimento.dataVencimento) {
        const dateObj = new Date(this.investimento.dataVencimento);
        if (!isNaN(dateObj.getTime())) {
          const dia = String(dateObj.getDate()).padStart(2, '0');
          const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
          const ano = dateObj.getFullYear();
          this.form.patchValue({ dataVencimento: `${dia}${mes}${ano}` });
        }
      }

      // Desabilitar aporte inicial na edição (para não complicar o histórico gerado)
      this.form.get('aporteInicial')?.disable();
    }
  }

  onHide() {
    this.closeModal.emit(false);
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      const rawValues = this.form.getRawValue();

      const invData: Investimento = {
        nome: rawValues.nome,
        descricao: rawValues.descricao,
        tipo: rawValues.tipo,
        instituicao: rawValues.instituicao,
        instituicaoOutros: rawValues.instituicao === 'Outros' ? rawValues.instituicaoOutros : null,
        aporteInicial: Number(rawValues.aporteInicial) || 0,
        valorAtual: this.investimento ? this.investimento.valorAtual : (Number(rawValues.aporteInicial) || 0),
        criadoEm: this.investimento ? this.investimento.criadoEm : new Date().toISOString()
      };

      if (rawValues.dataVencimento && typeof rawValues.dataVencimento === 'string' && rawValues.dataVencimento.length === 8) {
        const d = rawValues.dataVencimento;
        const dia = parseInt(d.substring(0, 2), 10);
        const mes = parseInt(d.substring(2, 4), 10) - 1;
        const ano = parseInt(d.substring(4, 8), 10);
        invData.dataVencimento = new Date(ano, mes, dia).toISOString();
      }

      if (this.investimento && this.investimento.id) {
        await this.investimentoService.updateInvestimento(this.investimento.id, invData);
      } else {
        await this.investimentoService.addInvestimento(invData);
      }

      this.closeModal.emit(true);
    } catch (error) {
      console.error('Erro ao salvar investimento', error);
      alert('Ocorreu um erro ao salvar.');
    } finally {
      this.isLoading = false;
    }
  }
}
