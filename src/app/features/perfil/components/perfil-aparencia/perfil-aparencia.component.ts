import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-perfil-aparencia',
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
          <span class="material-symbols-outlined text-[#9b87f5] text-[20px]">{{
            isDark() ? 'light_mode' : 'dark_mode'
          }}</span>
        </div>
        <div>
          <h3 class="text-[15px] font-semibold text-slate-900 dark:text-white">Aparência</h3>
          <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">
            Alterne entre o tema claro e escuro do aplicativo.
          </p>
        </div>
      </div>

      <button
        type="button"
        (click)="themeService.toggleTheme()"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:ring-offset-2"
        [class.bg-[#9b87f5]]="isDark()"
        [class.bg-slate-200]="!isDark()"
        role="switch"
        [attr.aria-checked]="isDark()"
        [attr.aria-label]="isDark() ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          [class.translate-x-5]="isDark()"
          [class.translate-x-0]="!isDark()"
        ></span>
      </button>
    </div>
  `
})
export class PerfilAparenciaComponent {
  public themeService = inject(ThemeService);

  isDark = computed(() => this.themeService.currentTheme() === 'dark');
}
