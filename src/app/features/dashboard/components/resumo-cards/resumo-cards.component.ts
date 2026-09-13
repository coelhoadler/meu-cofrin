import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Variacao } from '../../../../core/models/resumo-mensal.model';

@Component({
  selector: 'app-resumo-cards',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
      <!-- Receitas Card -->
      <div id="tour-receitas-card"
        class="bg-white dark:bg-[#1a112c] rounded-[20px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 relative flex flex-col justify-between h-[140px] transition-colors duration-300">
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-5">Receitas</p>
          <h3 class="text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold text-slate-800 dark:text-white truncate"
            [title]="showValues() ? totalReceitas() : ''">{{ showValues() ? totalReceitas() : 'R$ ••••' }}</h3>
        </div>
        @if (variacaoReceitas(); as vr) {
        <div class="mt-auto flex items-center gap-1 w-full">
          @if (vr.direction === 'up') {
          <span class="material-symbols-outlined text-emerald-500 text-[14px] shrink-0">trending_up</span>
          <p class="text-emerald-500 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">+{{ vr.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-slate-400 dark:text-slate-500 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else if (vr.direction === 'down') {
          <span class="material-symbols-outlined text-rose-500 text-[14px] shrink-0">trending_down</span>
          <p class="text-rose-500 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">-{{ vr.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-slate-400 dark:text-slate-500 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else {
          <p class="text-slate-400 dark:text-slate-500 text-[12px] font-medium truncate min-w-0">Sem alteração</p>
          }
        </div>
        }
        <div class="absolute top-5 right-5 w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-base">trending_up</span>
        </div>
      </div>

      <!-- Despesas Card -->
      <div id="tour-despesas-card"
        class="bg-white dark:bg-[#1a112c] rounded-[20px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 relative flex flex-col justify-between h-[140px] transition-colors duration-300">
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-5">Despesas</p>
          <h3 class="text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold text-slate-800 dark:text-white truncate"
            [title]="showValues() ? totalDespesas() : ''">{{ showValues() ? totalDespesas() : 'R$ ••••' }}</h3>
        </div>
        @if (variacaoDespesas(); as vd) {
        <div class="mt-auto flex items-center gap-1 w-full">
          @if (vd.direction === 'up') {
          <span class="material-symbols-outlined text-rose-500 text-[14px] shrink-0">trending_up</span>
          <p class="text-rose-500 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">+{{ vd.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-slate-400 dark:text-slate-500 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else if (vd.direction === 'down') {
          <span class="material-symbols-outlined text-emerald-500 text-[14px] shrink-0">trending_down</span>
          <p class="text-emerald-500 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">-{{ vd.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-slate-400 dark:text-slate-500 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else {
          <p class="text-slate-400 dark:text-slate-500 text-[12px] font-medium truncate min-w-0">Sem alteração</p>
          }
        </div>
        }
        <div class="absolute top-5 right-5 w-8 h-8 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-rose-500 dark:text-rose-400 text-base">trending_down</span>
        </div>
      </div>

      <!-- Saldo Card -->
      <div id="tour-saldo-card"
        class="bg-gradient-to-br from-[#381174] via-[#581fa4] to-[#7941dc] text-white rounded-[20px] p-6 shadow-lg shadow-purple-900/15 relative overflow-hidden flex flex-col justify-between h-[140px] transition-all">
        <div class="relative z-10">
          <p class="text-purple-200/90 text-sm font-medium mb-5">Saldo do mês</p>
          <h3 class="text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold text-white truncate tracking-tight"
            [title]="showValues() ? saldoMes() : ''">{{ showValues() ? saldoMes() : 'R$ ••••' }}</h3>
        </div>
        @if (variacaoSaldo(); as vs) {
        <div class="relative z-10 mt-auto flex items-center gap-1 w-full">
          @if (vs.direction === 'up') {
          <span class="material-symbols-outlined text-emerald-400 text-[14px] shrink-0">trending_up</span>
          <p class="text-emerald-400 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">+{{ vs.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-purple-200/80 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else if (vs.direction === 'down') {
          <span class="material-symbols-outlined text-rose-400 text-[14px] shrink-0">trending_down</span>
          <p class="text-rose-400 text-[12px] font-medium flex-1 flex items-center min-w-0 gap-1">
            <span class="shrink-0">-{{ vs.percent | number:'1.0-1' }}%</span>
            <span class="font-normal text-purple-200/80 truncate min-w-0">em comparação ao mês passado</span>
          </p>
          } @else {
          <p class="text-purple-200/80 text-[12px] font-medium truncate min-w-0">Sem alteração</p>
          }
        </div>
        }
        <!-- Icon top right -->
        <div (click)="toggleVisibility.emit()"
          class="top-5 right-5 w-10 h-10 bg-white/15 hover:bg-white/25 active:scale-95 rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer transition-all absolute z-10 shadow-sm"
          title="Ocultar / Mostrar valores">
          @if (showValues()) {
          <span class="material-symbols-outlined text-white text-xl">visibility</span>
          } @else {
          <span class="material-symbols-outlined text-white text-xl">visibility_off</span>
          }
        </div>
      </div>
    </div>
  `
})
export class ResumoCardsComponent {
  totalReceitas = input.required<string>();
  totalDespesas = input.required<string>();
  saldoMes = input.required<string>();
  variacaoReceitas = input<Variacao>(null);
  variacaoDespesas = input<Variacao>(null);
  variacaoSaldo = input<Variacao>(null);
  showValues = input<boolean>(true);

  toggleVisibility = output<void>();
}
