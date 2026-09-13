import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-grafico-pizza',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="tour-dist-mes"
      class="bg-white dark:bg-[#1a112c] rounded-[20px] p-3 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 flex flex-col h-[320px] transition-colors duration-300">
      <div>
        <h3 class="text-[15px] font-bold text-slate-800 dark:text-white">Distribuição do mês</h3>
        <p class="text-[13px] text-slate-500 dark:text-slate-400">Composição atual</p>
      </div>
      <!-- Chart Area -->
      <div class="flex-1 relative mt-4 min-h-[200px]">
        <canvas baseChart [data]="chartData()" [options]="chartOptions()" [type]="'pie'"></canvas>
      </div>
    </div>
  `
})
export class GraficoPizzaComponent {
  chartData = input.required<ChartConfiguration<'pie'>['data']>();
  chartOptions = input.required<ChartConfiguration<'pie'>['options']>();
}
