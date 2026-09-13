import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Conta } from '../../../../core/models/conta.model';
import { formatDataVencimento, formatDataPagamento } from '../../../../core/utils/formatacao.utils';

@Component({
  selector: 'app-detalhes-conta-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (conta(); as c) {
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      (click)="close.emit()">
      <div
        class="bg-white dark:bg-[#1a112c] rounded-t-[28px] sm:rounded-[24px] shadow-xl w-full max-w-sm overflow-hidden transform transition-transform"
        (click)="$event.stopPropagation()">
        <div class="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">{{ c.nome }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {{ c.valor }} • Venc: {{ formatVencimento(c) }}
            </p>
            @if (c.isRecorrente) {
            <p class="text-xs text-[#421b7b] dark:text-[#a78bfa] font-medium mt-1.5 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">autorenew</span>
              Essa conta se repete todo o mês
            </p>
            }
            @if (c.statusPago) {
            <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px]">check</span>
              {{ c.dataPagamento ? 'Pago no dia ' + formatPagamento(c.dataPagamento) : 'Pago' }}
            </p>
            }
          </div>
          <button (click)="close.emit()"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div class="p-3 flex flex-col gap-1">
          <a [routerLink]="['/editar-conta', c.id]" (click)="close.emit()"
            class="flex items-center gap-4 w-full p-4 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors font-semibold">
            <div
              class="w-10 h-10 rounded-full bg-[#421b7b]/10 dark:bg-[#421b7b]/20 flex items-center justify-center text-[#421b7b] dark:text-[#a78bfa]">
              <span class="material-symbols-outlined">edit</span>
            </div>
            Editar conta
          </a>
          <button (click)="delete.emit(c.id!)"
            class="flex items-center gap-4 w-full p-4 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors font-semibold">
            <div
              class="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <span class="material-symbols-outlined">delete</span>
            </div>
            Excluir conta
          </button>
          @if (!c.statusPago) {
          <button (click)="marcarComoPaga.emit(c.id!)"
            class="flex items-center gap-4 w-full p-4 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors font-semibold">
            <div
              class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500 dark:text-green-400">
              <span class="material-symbols-outlined">check</span>
            </div>
            Já foi paga
          </button>
          }
        </div>
      </div>
    </div>
    }
  `
})
export class DetalhesContaModalComponent {
  conta = input<Conta | null>(null);

  close = output<void>();
  marcarComoPaga = output<string>();
  delete = output<string>();

  formatVencimento = formatDataVencimento;
  formatPagamento = formatDataPagamento;
}
