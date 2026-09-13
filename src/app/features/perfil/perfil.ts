import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';

import { PerfilFotoComponent } from './components/perfil-foto/perfil-foto.component';
import { PerfilDadosComponent } from './components/perfil-dados/perfil-dados.component';
import { PerfilNotificacoesComponent } from './components/perfil-notificacoes/perfil-notificacoes.component';
import { PerfilSegurancaComponent } from './components/perfil-seguranca/perfil-seguranca.component';
import { DeletarContaModalComponent } from './components/deletar-conta-modal/deletar-conta-modal.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PerfilFotoComponent,
    PerfilDadosComponent,
    PerfilNotificacoesComponent,
    PerfilSegurancaComponent,
    DeletarContaModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.html',
})
export class Perfil {
  private authService = inject(AuthService);
  public navigationHistory = inject(NavigationHistoryService);

  user = this.authService.currentUser;

  successMessage = signal('');
  errorMessage = signal('');
}
