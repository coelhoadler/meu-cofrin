import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-perfil-dados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-white dark:bg-[#1a112c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6 transition-colors duration-300"
    >
      <form (ngSubmit)="saveProfile()" class="space-y-6">
        <div>
          <label
            class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            <span class="material-symbols-outlined text-[18px]">mail</span>
            E-mail
          </label>
          <input
            type="email"
            [value]="user()?.email || ''"
            readonly
            autocomplete="email"
            class="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 sm:text-sm"
          />
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            O e-mail de acesso não pode ser alterado por aqui.
          </p>

          <div class="mt-4">
            @if (user()?.emailVerified) {
              <div
                class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-500 dark:text-emerald-700 dark:text-emerald-800 rounded-xl text-sm flex items-center gap-2"
              >
                <span
                  class="material-symbols-outlined text-[18px] text-emerald-500 dark:text-emerald-700"
                  >check_circle</span
                >
                <span>O e-mail foi verificado.</span>
              </div>
            } @else {
              <div
                class="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px] text-amber-500">warning</span>
                  <span
                    >O e-mail não foi verificado. É importante verificar o e-mail para poder receber
                    as notificações de vencimento das contas.</span
                  >
                </div>
                <button
                  type="button"
                  (click)="resendVerificationEmail()"
                  [disabled]="isSendingEmail()"
                  class="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 hover:text-amber-800 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  {{ isSendingEmail() ? 'Enviando...' : 'Reenviar verificação' }}
                </button>
              </div>
            }
          </div>
        </div>

        <div>
          <label
            for="displayName"
            class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            <span class="material-symbols-outlined text-[18px]">person</span>
            Nome de exibição
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            [ngModel]="displayName()"
            (ngModelChange)="displayName.set($event)"
            autocomplete="name"
            class="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white bg-white dark:bg-[#130c25] focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] sm:text-sm transition-colors"
            placeholder="Seu nome"
          />
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            [disabled]="isLoading()"
            class="px-6 py-2.5 bg-[#9b87f5] hover:bg-[#8a75e4] text-white font-medium rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9b87f5] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            @if (isLoading()) {
              Salvando...
            } @else {
              Salvar alterações
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class PerfilDadosComponent {
  private authService = inject(AuthService);

  user = input<User | null>(null);

  successMessage = output<string>();
  errorMessage = output<string>();

  displayName = signal('');
  isLoading = signal(false);
  isSendingEmail = signal(false);

  constructor() {
    effect(() => {
      const u = this.user();
      if (u?.displayName && !this.displayName()) {
        this.displayName.set(u.displayName);
      }
    });
  }

  async saveProfile() {
    if (!this.displayName().trim()) {
      this.errorMessage.emit('O nome não pode estar vazio.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.emit('');
    this.successMessage.emit('');

    try {
      await this.authService.updateCurrentUserProfile({
        displayName: this.displayName(),
      });
      this.successMessage.emit('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      this.errorMessage.emit('Erro ao atualizar o perfil. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendVerificationEmail() {
    this.isSendingEmail.set(true);
    this.errorMessage.emit('');
    this.successMessage.emit('');

    try {
      await this.authService.sendVerificationEmail();
      this.successMessage.emit('E-mail de verificação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'auth/too-many-requests') {
        this.errorMessage.emit('Muitos pedidos recentes. Tente novamente mais tarde.');
      } else {
        this.errorMessage.emit('Erro ao enviar o e-mail de verificação. Tente novamente.');
      }
    } finally {
      this.isSendingEmail.set(false);
    }
  }
}
