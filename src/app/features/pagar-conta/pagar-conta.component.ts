import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContaService } from '../../core/services/conta.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagar-conta',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pagar-conta.component.html',
  styleUrls: ['./pagar-conta.component.css']
})
export class PagarContaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private contaService = inject(ContaService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.marcarComoPaga(id);
    } else {
      this.status.set('error');
      this.errorMessage.set('ID da conta não encontrado na URL.');
    }
  }

  async marcarComoPaga(id: string) {
    try {
      this.status.set('loading');
      await this.contaService.marcarComoPaga(id);
      this.status.set('success');
    } catch (error: any) {
      console.error('Erro ao marcar conta como paga:', error);
      this.status.set('error');
      this.errorMessage.set(error.message || 'Ocorreu um erro ao atualizar a conta. Tente novamente mais tarde.');
    }
  }
}
