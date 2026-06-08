import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContaService, Conta } from '../../core/services/conta.service';
import { AuthService } from '../../core/auth/auth.service';
import { MessagingService } from '../../core/services/messaging.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  currentDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  private contaService = inject(ContaService);
  private authService = inject(AuthService);
  private messagingService = inject(MessagingService);

  lancamentos = signal<Conta[]>([]);
  isLoading = signal(true);

  selectedConta = signal<Conta | null>(null);

  totalDespesas = signal('R$ 0,00');
  totalReceitas = signal('R$ 0,00');
  saldoMes = signal('R$ 0,00');
  totalAPagar = signal('R$ 0,00');

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'start',
        labels: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      }
    }
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 0
    }]
  };

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadLancamentos();
        this.loadResumoMes();

        // Pede permissão para notificações e salva o token (ideal ser chamado após login)
        this.messagingService.requestPermissionAndGetToken();
        this.messagingService.listenForMessages();
      }
    });
  }

  async loadLancamentos() {
    this.isLoading.set(true);
    try {
      const recentes = await this.contaService.getLancamentosRecentes();
      this.lancamentos.set(recentes);
    } catch (error) {
      console.error('Erro ao buscar lançamentos recentes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadResumoMes() {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const mesRef = `${year}-${month}`;

      const contasDoMes = await this.contaService.getContasByMesReferencia(mesRef);

      let somaDespesas = 0;
      let somaReceitas = 0;
      let somaAPagar = 0;
      const chartDataMap = new Map<string, number>();

      contasDoMes.forEach(c => {
        if (c.valor) {
          const cleanValue = c.valor.replace(/\./g, '').replace(',', '.').replace('R$', '');
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            if (c.tipo === 'Despesa') {
              somaDespesas += numValue;
              if (!c.statusPago) {
                somaAPagar += numValue;
              }
            }
            if (c.tipo === 'Receita') somaReceitas += numValue;

            const label = `${c.tipo} - ${c.categoria || 'Outros'}`;
            chartDataMap.set(label, (chartDataMap.get(label) || 0) + numValue);
          }
        }
      });

      const labels = Array.from(chartDataMap.keys());
      const data = Array.from(chartDataMap.values());
      const colors = [
        '#421b7b', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
      ];

      // Update chart with deep copy to trigger change detection in ng2-charts
      this.pieChartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      };

      const saldo = somaReceitas - somaDespesas;

      const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
      this.totalDespesas.set(formatter.format(somaDespesas));
      this.totalReceitas.set(formatter.format(somaReceitas));
      this.saldoMes.set(formatter.format(saldo));
      this.totalAPagar.set(formatter.format(somaAPagar));

    } catch (error) {
      console.error('Erro ao buscar resumo do mês:', error);
    }
  }

  openModal(conta: Conta) {
    this.selectedConta.set(conta);
  }

  closeModal() {
    this.selectedConta.set(null);
  }

  async deleteLancamento(id: string | undefined) {
    if (!id) return;

    if (window.confirm('Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.')) {
      try {
        await this.contaService.deleteConta(id);
        this.closeModal();
        // Recarregar os lançamentos após deletar
        await this.loadLancamentos();
        await this.loadResumoMes();
      } catch (error) {
        console.error('Erro ao deletar lançamento:', error);
        alert('Erro ao deletar lançamento. Tente novamente.');
      }
    }
  }
}
