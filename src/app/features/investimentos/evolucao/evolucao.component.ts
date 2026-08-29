import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvestimentoService } from '../../../core/services/investimento.service';
import { Investimento, RegistroInvestimento } from '../../../core/models/investimento.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-evolucao',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, ProgressSpinnerModule, DialogModule, ReactiveFormsModule, ButtonModule, NgxCurrencyDirective, NgxMaskDirective],
  templateUrl: './evolucao.component.html'
})
export class EvolucaoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private investimentoService = inject(InvestimentoService);
  private fb = inject(FormBuilder);

  investimentoId = signal<string | null>(null);
  investimento = signal<Investimento | null>(null);
  registros = signal<RegistroInvestimento[]>([]);
  registrosDesc = computed(() => [...this.registros()].reverse());
  isLoading = signal(true);

  // Modal Novo Registro
  showModal = signal(false);
  formRegistro!: FormGroup;
  isSaving = signal(false);

  // Chart config
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  lineChartData = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: []
  });

  ngOnInit() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    this.formRegistro = this.fb.group({
      data: [`${dia}${mes}${ano}`, Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]],
      anotacao: ['']
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.investimentoId.set(id);
        this.loadData(id);
      } else {
        this.router.navigate(['/investimentos']);
      }
    });
  }

  async loadData(id: string) {
    this.isLoading.set(true);
    try {
      const inv = await this.investimentoService.getInvestimentoById(id);
      if (!inv) {
        this.router.navigate(['/investimentos']);
        return;
      }
      this.investimento.set(inv);

      const regs = await this.investimentoService.getRegistros(id);
      this.registros.set(regs);

      this.updateChart(regs);
    } catch (error) {
      console.error('Erro ao carregar evolução', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  updateChart(regs: RegistroInvestimento[]) {
    const labels = regs.map(r => {
      const date = new Date(r.data);
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
    });

    const dataValues = regs.map(r => r.valor);

    this.lineChartData.set({
      labels,
      datasets: [
        {
          data: dataValues,
          label: 'Valor',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#421b7b',
          pointRadius: 4
        }
      ]
    });
  }

  getRentabilidade() {
    const inv = this.investimento();
    if (!inv) return { valor: 0, percentual: 0, positiva: true };

    const rendimento = inv.valorAtual - inv.aporteInicial;
    let percentual = 0;
    if (inv.aporteInicial > 0) {
      percentual = (rendimento / inv.aporteInicial) * 100;
    }
    return {
      valor: rendimento,
      percentual: Math.abs(percentual),
      positiva: rendimento >= 0
    };
  }

  openNovoRegistro() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    this.formRegistro.patchValue({
      data: `${dia}${mes}${ano}`,
      valor: this.investimento()?.valorAtual || 0,
      anotacao: ''
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveRegistro() {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }

    const id = this.investimentoId();
    if (!id) return;

    this.isSaving.set(true);
    try {
      const raw = this.formRegistro.getRawValue();
      
      let isoDate = new Date().toISOString();
      if (raw.data && typeof raw.data === 'string' && raw.data.length === 8) {
        const d = raw.data;
        const dia = parseInt(d.substring(0, 2), 10);
        const mes = parseInt(d.substring(2, 4), 10) - 1;
        const ano = parseInt(d.substring(4, 8), 10);
        
        const now = new Date();
        isoDate = new Date(ano, mes, dia, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
      }

      const registro: RegistroInvestimento = {
        data: isoDate,
        valor: Number(raw.valor),
        anotacao: raw.anotacao
      };

      await this.investimentoService.addRegistro(id, registro);
      
      this.closeModal();
      await this.loadData(id); // reload tudo
    } catch (error) {
      console.error('Erro ao salvar registro', error);
      alert('Erro ao salvar o registro. Tente novamente.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteRegistro(regId: string | undefined) {
    const id = this.investimentoId();
    if (!id || !regId) return;

    if (confirm('Deseja realmente excluir este registro? O valor atual do investimento será mantido, mas o histórico será afetado.')) {
      try {
        await this.investimentoService.deleteRegistro(id, regId);
        await this.loadData(id);
      } catch (error) {
        console.error('Erro ao excluir registro', error);
      }
    }
  }
}
