import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContaService, Conta } from '../../core/services/conta.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  currentDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  private contaService = inject(ContaService);
  private authService = inject(AuthService);

  lancamentos = signal<Conta[]>([]);
  isLoading = signal(true);

  totalDespesas = signal('R$ 0,00');
  totalReceitas = signal('R$ 0,00');
  saldoMes = signal('R$ 0,00');

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadLancamentos();
        this.loadResumoMes();
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

      contasDoMes.forEach(c => {
        if (c.valor) {
          const cleanValue = c.valor.replace(/\./g, '').replace(',', '.').replace('R$', '');
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            if (c.tipo === 'Despesa') somaDespesas += numValue;
            if (c.tipo === 'Receita') somaReceitas += numValue;
          }
        }
      });

      const saldo = somaReceitas - somaDespesas;

      const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
      this.totalDespesas.set(formatter.format(somaDespesas));
      this.totalReceitas.set(formatter.format(somaReceitas));
      this.saldoMes.set(formatter.format(saldo));

    } catch (error) {
      console.error('Erro ao buscar resumo do mês:', error);
    }
  }

  async deleteLancamento(id: string | undefined) {
    if (!id) return;

    if (window.confirm('Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.')) {
      try {
        await this.contaService.deleteConta(id);
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
