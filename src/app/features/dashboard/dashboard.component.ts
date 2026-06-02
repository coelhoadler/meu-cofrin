import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContaService, Conta } from '../../core/services/conta.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  
  private contaService = inject(ContaService);
  lancamentos = signal<Conta[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const recentes = await this.contaService.getLancamentosRecentes();
      this.lancamentos.set(recentes);
    } catch (error) {
      console.error('Erro ao buscar lançamentos recentes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
