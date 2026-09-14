import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-grafico-barras',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full h-full' },
  template: `
    <div id="tour-grafico-resumo"
      class="bg-white dark:bg-[#1a112c] rounded-[20px] p-3 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 flex flex-col h-[320px] transition-colors duration-300">
      <div class="mb-4">
        <h3 class="text-[15px] font-bold text-slate-800 dark:text-white">Últimos 6 meses</h3>
        <p class="text-[13px] text-slate-500 dark:text-slate-400">Receitas vs Despesas</p>
      </div>
      <!-- Chart Area -->
      <div class="flex-1 relative w-full h-full min-h-[200px]">
        <canvas baseChart [data]="chartData()" [options]="chartOptions()" [type]="'bar'"></canvas>
      </div>
      <!-- Legend -->
      <div class="flex justify-center gap-6 mt-4">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-sm bg-[#9d6bf3]"></div>
          <span class="text-[11px] text-slate-500 font-medium">Receitas</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-sm bg-[#421b7b]"></div>
          <span class="text-[11px] text-slate-500 font-medium">Despesas</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-0.5 rounded-sm bg-[#10b981]"></div>
          <span class="text-[11px] text-slate-500 font-medium">Saldo</span>
        </div>
      </div>
    </div>
  `
})
export class GraficoBarrasComponent {
  chartData = input.required<ChartConfiguration<'bar'>['data']>();
  chartOptions = input.required<ChartConfiguration<'bar'>['options']>();
}
