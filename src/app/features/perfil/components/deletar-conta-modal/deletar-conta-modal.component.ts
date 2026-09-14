import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-deletar-conta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <!-- Card: Danger Zone -->
    <div
      class="bg-white dark:bg-[#1a112c] rounded-2xl shadow-sm border border-rose-200 dark:border-rose-900/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300"
    >
      <div class="flex items-start gap-4">
        <div
          class="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <span class="material-symbols-outlined text-rose-500 dark:text-rose-400 text-[20px]"
            >delete_forever</span
          >
        </div>
        <div>
          <h3 class="text-[15px] font-semibold text-rose-700 dark:text-rose-400">Excluir conta</h3>
          <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
            Apague permanentemente sua conta de usuário e todos os registros associados no sistema.
          </p>
        </div>
      </div>

      <button
        type="button"
        (click)="openDeleteModal()"
        class="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
      >
        <span class="material-symbols-outlined text-[18px]">delete</span>
        Excluir minha conta
      </button>
    </div>

    <!-- Modal de Confirmação de Deleção de Conta -->
    @if (showDeleteModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        (click)="closeDeleteModal()"
      >
        <div
          class="bg-white dark:bg-[#1a112c] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div
            class="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0"
              >
                <span class="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                  Excluir conta permanentemente
                </h3>
                <p class="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Esta ação não pode ser desfeita!
                </p>
              </div>
            </div>
            <button
              (click)="closeDeleteModal()"
              [disabled]="isDeletingAccount()"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Ao excluir sua conta, todos os seus dados armazenados no
              <strong>Meu Cofrin</strong> serão permanentemente apagados dos nossos servidores no
              Firebase:
            </p>

            <ul class="space-y-2 pl-2">
              <li class="flex items-start gap-2">
                <span class="material-symbols-outlined text-rose-500 text-[18px] mt-0.5"
                  >account_circle</span
                >
                <span><strong>Autenticação:</strong> Seu login e dados da conta de acesso.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="material-symbols-outlined text-rose-500 text-[18px] mt-0.5"
                  >database</span
                >
                <span
                  ><strong>Banco de dados:</strong> Suas contas, despesas, receitas, resumos mensais e
                  categorias cadastradas.</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="material-symbols-outlined text-rose-500 text-[18px] mt-0.5"
                  >folder_open</span
                >
                <span><strong>Armazenamento:</strong> Sua foto de perfil e todos os comprovantes e
                  recibos anexados.</span>
              </li>
            </ul>

            @if (deleteModalError()) {
              <div
                class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-rose-500 shrink-0">error</span>
                <span>{{ deleteModalError() }}</span>
              </div>
            }

            <!-- Checkbox de confirmação -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/50">
              <label class="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  [ngModel]="isConfirmChecked()"
                  (change)="isConfirmChecked.set($any($event.target).checked)"
                  [disabled]="isDeletingAccount()"
                  class="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 focus:ring-offset-0 dark:bg-[#130c25]"
                />
                <span
                  class="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                >
                  Estou ciente de que todos os meus dados serão permanentemente excluídos e que esta
                  ação é
                  <strong>irreversível</strong>.
                </span>
              </label>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end gap-3"
          >
            <button
              type="button"
              (click)="closeDeleteModal()"
              [disabled]="isDeletingAccount()"
              class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              (click)="confirmDeleteAccount()"
              [disabled]="!isConfirmChecked() || isDeletingAccount()"
              class="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (isDeletingAccount()) {
                <span class="material-symbols-outlined animate-spin text-[18px]"
                  >progress_activity</span
                >
                <span>Excluindo dados...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Excluir conta permanentemente</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DeletarContaModalComponent {
  private authService = inject(AuthService);

  showDeleteModal = signal(false);
  isConfirmChecked = signal(false);
  isDeletingAccount = signal(false);
  deleteModalError = signal('');

  openDeleteModal() {
    this.showDeleteModal.set(true);
    this.isConfirmChecked.set(false);
    this.deleteModalError.set('');
  }

  closeDeleteModal() {
    if (this.isDeletingAccount()) return;
    this.showDeleteModal.set(false);
    this.isConfirmChecked.set(false);
    this.deleteModalError.set('');
  }

  async confirmDeleteAccount() {
    if (!this.isConfirmChecked() || this.isDeletingAccount()) return;

    this.isDeletingAccount.set(true);
    this.deleteModalError.set('');

    try {
      await this.authService.deleteUserAccount();
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error);
      if (error?.code === 'auth/requires-recent-login') {
        this.deleteModalError.set(
          'Por motivos de segurança, esta ação requer um login recente. Faça logout e entre novamente para concluir a exclusão.'
        );
      } else {
        this.deleteModalError.set(
          error?.message || 'Erro ao excluir a conta. Tente novamente mais tarde.'
        );
      }
      this.isDeletingAccount.set(false);
    }
  }
}
