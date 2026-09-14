import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ContaReplicavel } from '../../services/replicar-mes.service';

@Component({
  selector: 'app-replicar-mes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (visible()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      (click)="close.emit()">
      <div
        class="bg-white dark:bg-[#1a112c] rounded-[24px] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-start justify-between shrink-0">
          <div>
            <h3 class="text-xl font-bold text-slate-800 dark:text-white">Replicar mês</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Copie as contas de um mês para outro. Contas duplicadas (mesmo nome e vencimento) são destacadas e
              desmarcadas por padrão.
            </p>
          </div>
          <button (click)="close.emit()"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-4 shrink-0">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mês de origem</label>
              <p-datepicker [ngModel]="mesOrigem()" (ngModelChange)="mesOrigemChange.emit($event)"
                view="month" dateFormat="MM yy" styleClass="w-full"
                inputStyleClass="w-full px-4 py-2.5 bg-white dark:bg-[#130c25] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#421b7b]/50 focus:border-[#421b7b] transition-all text-sm"></p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mês de destino</label>
              <p-datepicker [ngModel]="mesDestino()" (ngModelChange)="mesDestinoChange.emit($event)"
                view="month" dateFormat="MM yy" styleClass="w-full"
                inputStyleClass="w-full px-4 py-2.5 bg-white dark:bg-[#130c25] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#421b7b]/50 focus:border-[#421b7b] transition-all text-sm"></p-datepicker>
            </div>
          </div>

          <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div
              class="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Contas em {{ formatDateName(mesOrigem()) }}
              </h4>

              @if (contasParaReplicar().length > 0) {
              <div class="flex items-center gap-2 cursor-pointer group" (click)="toggleAll.emit()">
                <span
                  class="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {{ isAllSelected() ? 'Desmarcar todas' : 'Selecionar todas' }}
                </span>
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors p-3"
                  [ngClass]="isAllSelected() ? 'border-[#421b7b] bg-[#421b7b]' : 'border-slate-300 dark:border-slate-600'">
                  @if (isAllSelected()) {
                  <span class="material-symbols-outlined text-white text-[8px]">check</span>
                  }
                </div>
              </div>
              }
            </div>

            <div class="p-0">
              @if (isLoading()) {
              <div class="flex items-center justify-center py-12">
                <div class="w-8 h-8 border-4 border-[#421b7b]/20 border-t-[#421b7b] rounded-full animate-spin"></div>
              </div>
              } @else if (contasParaReplicar().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2">info</span>
                <p class="text-sm">Nenhuma conta encontrada em {{ formatDateName(mesOrigem()) }}.</p>
              </div>
              } @else {
              <ul class="divide-y divide-slate-100 dark:divide-slate-800/50">
                @for (conta of contasParaReplicar(); track conta.id) {
                <li
                  class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  [ngClass]="{'opacity-60': conta.existsInDestino, 'cursor-pointer': !conta.existsInDestino}"
                  (click)="toggleConta.emit(conta)">

                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0">
                      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors p-3"
                        [ngClass]="conta.selected ? 'border-[#421b7b] bg-[#421b7b]' : 'border-slate-300 dark:border-slate-600'">
                        @if (conta.selected) {
                        <span class="material-symbols-outlined text-white text-[8px]">check</span>
                        }
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-slate-800 dark:text-slate-200">{{ conta.nome }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="conta.tipo === 'Receita' ? 'bg-[#421b7b] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
                          {{ conta.tipo }}
                        </span>
                        @if (conta.existsInDestino) {
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-orange-500 border border-orange-200 dark:border-orange-500/30">
                          replicado
                        </span>
                        }
                      </div>
                      <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Vence dia {{ conta.diaVencimento }}
                      </span>
                    </div>
                  </div>

                  <div class="font-bold pr-2" [ngClass]="conta.tipo === 'Receita' ? 'text-emerald-600' : 'text-red-500'">
                    R$ {{ conta.valor }}
                  </div>
                </li>
                }
              </ul>
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/20 shrink-0">
          <button (click)="close.emit()"
            class="px-5 py-2.5 bg-white dark:bg-[#130c25] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm font-semibold transition-colors">
            Cancelar
          </button>
          <button (click)="confirm.emit()" [disabled]="isLoading() || selectedCount() === 0"
            class="px-5 py-2.5 bg-[#421b7b] hover:bg-[#341561] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {{ isLoading() ? 'Aguarde...' : 'Replicar ' + selectedCount() + ' contas' }}
          </button>
        </div>

      </div>
    </div>
    }
  `
})
export class ReplicarMesModalComponent {
  visible = input<boolean>(false);
  mesOrigem = input<Date | null>(null);
  mesDestino = input<Date | null>(null);
  contasParaReplicar = input<ContaReplicavel[]>([]);
  isLoading = input<boolean>(false);
  isAllSelected = input<boolean>(false);
  selectedCount = input<number>(0);

  close = output<void>();
  mesOrigemChange = output<Date>();
  mesDestinoChange = output<Date>();
  toggleAll = output<void>();
  toggleConta = output<ContaReplicavel>();
  confirm = output<void>();

  formatDateName(date: Date | null): string {
    if (!date) return '';
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
    const ano = date.getFullYear();
    return `${mes} de ${ano}`;
  }
}
