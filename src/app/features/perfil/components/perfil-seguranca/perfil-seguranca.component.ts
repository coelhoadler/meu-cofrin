import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { WebauthnService } from '../../../../core/auth/webauthn.service';

@Component({
  selector: 'app-perfil-seguranca',
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
          <span class="material-symbols-outlined text-[#9b87f5] text-[20px]">fingerprint</span>
        </div>
        <div>
          <h3 class="text-[15px] font-semibold text-slate-900 dark:text-white">Acesso biométrico</h3>
          <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">
            Use a digital, Face ID ou Windows Hello deste dispositivo para entrar mais rápido.
          </p>
        </div>
      </div>

      <button
        type="button"
        (click)="toggleBiometrics()"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:ring-offset-2"
        [class.bg-[#9b87f5]]="biometricsEnabled()"
        [class.bg-slate-200]="!biometricsEnabled()"
        role="switch"
        [attr.aria-checked]="biometricsEnabled()"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          [class.translate-x-5]="biometricsEnabled()"
          [class.translate-x-0]="!biometricsEnabled()"
        ></span>
      </button>
    </div>
  `
})
export class PerfilSegurancaComponent implements OnInit {
  private webauthnService = inject(WebauthnService);

  user = input<User | null>(null);

  successMessage = output<string>();
  errorMessage = output<string>();

  biometricsEnabled = signal(false);

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('biometricsEnabled');
      if (stored === 'true') {
        this.biometricsEnabled.set(true);
      }
    }
  }

  async toggleBiometrics() {
    const previousState = this.biometricsEnabled();
    this.biometricsEnabled.update(v => !v);

    if (this.biometricsEnabled()) {
      try {
        this.errorMessage.emit('');
        await this.webauthnService.registerPasskey();
        this.successMessage.emit('Biometria habilitada com sucesso!');
        localStorage.setItem('biometricsEnabled', 'true');
        const email = this.user()?.email;
        if (email) {
          localStorage.setItem('biometricEmail', email);
        }
      } catch (error: any) {
        console.error(error);
        this.biometricsEnabled.set(previousState);
        this.errorMessage.emit(error.message || 'Erro ao habilitar biometria.');
        localStorage.setItem('biometricsEnabled', 'false');
      }
    } else {
      localStorage.setItem('biometricsEnabled', 'false');
      localStorage.removeItem('biometricEmail');
      this.successMessage.emit('Biometria desabilitada para este dispositivo.');
    }
  }
}
