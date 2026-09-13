import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Conta } from '../../../../core/models/conta.model';
import { formatDataVencimento } from '../../../../core/utils/formatacao.utils';

@Component({
  selector: 'app-recibo-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog header="Detalhes do Recibo" [modal]="true" [visible]="visible()" (visibleChange)="visibleChange.emit($event)"
      [style]="{ width: '90vw', maxWidth: '600px' }" [dismissableMask]="true">
      @if (conta(); as c) {
      <div class="mb-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        <div
          class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
          <div>
            <p class="font-bold text-base text-slate-800 dark:text-slate-100">{{ c.nome }}</p>
            @if (c.categoria) {
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ c.categoria }}</p>
            }
          </div>
          <div class="text-right">
            <p class="font-bold text-lg" [ngClass]="c.tipo === 'Receita' ? 'text-emerald-600' : 'text-rose-500'">
              {{ c.tipo === 'Receita' ? '+ ' : '- ' }}{{ c.valor }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Venc: {{ formatVencimento(c) }}</p>
          </div>
        </div>
      </div>
      <div class="flex justify-center items-center bg-slate-100 dark:bg-slate-900/50 rounded-lg p-2 min-h-[200px]">
        @if (c.reciboUrl) {
        @if (isLoading()) {
        <p-progress-spinner ariaLabel="loading"></p-progress-spinner>
        }
        <img [src]="c.reciboUrl" alt="Recibo" class="max-w-full max-h-[60vh] object-contain rounded"
          [class.hidden]="isLoading()" (load)="imageLoad.emit()" (error)="imageError.emit()" />
        } @else {
        <div class="text-slate-500">Imagem não encontrada.</div>
        }
      </div>
      }
    </p-dialog>
  `
})
export class ReciboModalComponent {
  conta = input<Conta | null>(null);
  visible = input<boolean>(false);
  isLoading = input<boolean>(true);

  visibleChange = output<boolean>();
  imageLoad = output<void>();
  imageError = output<void>();

  formatVencimento = formatDataVencimento;
}
