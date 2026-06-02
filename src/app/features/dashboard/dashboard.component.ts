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

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadLancamentos();
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

  async deleteLancamento(id: string | undefined) {
    if (!id) return;
    
    if (window.confirm('Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.')) {
      try {
        await this.contaService.deleteConta(id);
        // Recarregar os lançamentos após deletar
        await this.loadLancamentos();
      } catch (error) {
        console.error('Erro ao deletar lançamento:', error);
        alert('Erro ao deletar lançamento. Tente novamente.');
      }
    }
  }
}
