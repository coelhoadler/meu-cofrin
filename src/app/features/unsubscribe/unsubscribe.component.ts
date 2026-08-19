import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-unsubscribe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.css']
})
export class UnsubscribeComponent implements OnInit {
  private route = inject(ActivatedRoute);

  email = signal<string>('');
  userId = signal<string>('');
  
  readonly currentYear = new Date().getFullYear();
  
  // Estados: 'confirm' | 'loading' | 'unsubscribed' | 'resubscribed' | 'error'
  state = signal<'confirm' | 'loading' | 'unsubscribed' | 'resubscribed' | 'error'>('confirm');
  errorMessage = signal<string>('');

  private readonly cloudFunctionBaseUrl = 'https://us-central1-meu-cofrin.cloudfunctions.net';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'] || params['userEmail'] || '';
      const userIdParam = params['userId'] || '';
      const statusParam = params['status'] || '';

      this.email.set(emailParam);
      this.userId.set(userIdParam);

      if (statusParam === 'success') {
        this.state.set('unsubscribed');
      } else if (!emailParam) {
        this.state.set('error');
        this.errorMessage.set('Nenhum endereço de e-mail foi fornecido no link.');
      } else {
        this.state.set('confirm');
      }
    });
  }

  async confirmUnsubscribe() {
    if (!this.email()) return;

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const response = await fetch(`${this.cloudFunctionBaseUrl}/unsubscribeFn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email(),
          userId: this.userId()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.state.set('unsubscribed');
      } else {
        this.state.set('error');
        this.errorMessage.set(data.message || 'Não foi possível concluir o cancelamento. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao cancelar inscrição:', err);
      this.state.set('error');
      this.errorMessage.set('Erro de conexão com o servidor. Por favor, tente novamente mais tarde.');
    }
  }

  async resubscribe() {
    if (!this.email()) return;

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const response = await fetch(`${this.cloudFunctionBaseUrl}/resubscribeFn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email(),
          userId: this.userId()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.state.set('resubscribed');
      } else {
        this.state.set('error');
        this.errorMessage.set(data.message || 'Não foi possível reativar as notificações.');
      }
    } catch (err: any) {
      console.error('Erro ao reativar inscrição:', err);
      this.state.set('error');
      this.errorMessage.set('Erro de conexão ao reativar. Tente novamente.');
    }
  }
}
