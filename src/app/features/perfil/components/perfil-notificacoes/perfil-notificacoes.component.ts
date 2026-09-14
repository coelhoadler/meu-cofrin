import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-perfil-notificacoes',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-white dark:bg-[#1a112c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6 flex items-center justify-between gap-4 transition-colors duration-300"
    >
      <div class="flex items-start gap-4">
        <div
          class="w-10 h-10 rounded-full bg-[#f3f0ff] dark:bg-[#9b87f5]/10 flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <span class="material-symbols-outlined text-[#9b87f5] text-[20px]">mark_email_unread</span>
        </div>
        <div>
          <h3 class="text-[15px] font-semibold text-slate-900 dark:text-white">Lembretes por e-mail</h3>
          <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">
            Receba avisos diários no seu e-mail quando houver contas a vencer hoje ou nos próximos dias.
          </p>
        </div>
      </div>

      <button
        type="button"
        (click)="toggleEmailNotifications()"
        [disabled]="isTogglingNotifications()"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:ring-offset-2 disabled:opacity-50"
        [class.bg-[#9b87f5]]="emailNotificationsEnabled()"
        [class.bg-slate-200]="!emailNotificationsEnabled()"
        [class.dark:bg-slate-700]="!emailNotificationsEnabled()"
        role="switch"
        [attr.aria-checked]="emailNotificationsEnabled()"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          [class.translate-x-5]="emailNotificationsEnabled()"
          [class.translate-x-0]="!emailNotificationsEnabled()"
        ></span>
      </button>
    </div>
  `
})
export class PerfilNotificacoesComponent {
  private firestore = inject(Firestore);

  user = input<User | null>(null);

  successMessage = output<string>();
  errorMessage = output<string>();

  emailNotificationsEnabled = signal(true);
  isTogglingNotifications = signal(false);

  constructor() {
    effect(async () => {
      const u = this.user();
      if (u?.uid) {
        try {
          const userDocSnap = await getDoc(doc(this.firestore, `users/${u.uid}`));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data?.['notificacoesEmail'] !== undefined) {
              this.emailNotificationsEnabled.set(data['notificacoesEmail']);
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar preferências de notificação:', err);
        }
      }
    });
  }

  async toggleEmailNotifications() {
    const currentUser = this.user();
    if (!currentUser?.uid) return;

    const newState = !this.emailNotificationsEnabled();
    this.emailNotificationsEnabled.set(newState);
    this.isTogglingNotifications.set(true);

    try {
      await setDoc(
        doc(this.firestore, `users/${currentUser.uid}`),
        {
          notificacoesEmail: newState,
          emailNotificationsEnabled: newState,
        },
        { merge: true }
      );

      const endpoint = newState ? 'resubscribeFn' : 'unsubscribeFn';
      if (currentUser.email) {
        fetch(`https://us-central1-meu-cofrin.cloudfunctions.net/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            userId: currentUser.uid,
          }),
        }).catch(err => console.warn('Aviso ao sincronizar Postmark:', err));
      }

      this.successMessage.emit(
        newState
          ? 'Notificações por e-mail ativadas com sucesso!'
          : 'Notificações por e-mail desativadas com sucesso.'
      );
    } catch (e) {
      console.error('Erro ao atualizar preferências de notificação:', e);
      this.emailNotificationsEnabled.set(!newState);
      this.errorMessage.emit('Erro ao salvar preferências de e-mail.');
    } finally {
      this.isTogglingNotifications.set(false);
    }
  }
}
