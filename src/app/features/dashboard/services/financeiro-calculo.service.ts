import { Injectable } from '@angular/core';
import { Conta } from '../../../core/models/conta.model';
import { Variacao } from '../../../core/models/resumo-mensal.model';
import { parseFloatValor } from '../../../core/utils/formatacao.utils';

@Injectable({
  providedIn: 'root'
})
export class FinanceiroCalculoService {
  calcularVariacao(oldValue: number, newValue: number): Variacao {
    if (oldValue === 0) {
      if (newValue === 0) return { percent: 0, direction: 'none' };
      return null;
    }
    const percent = ((newValue - oldValue) / Math.abs(oldValue)) * 100;

    return {
      percent: Math.abs(percent),
      direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'none'
    };
  }

  calcularDiffDataVencimento(item: Conta): number {
    const [ano, mes] = item.mesReferencia.split('-');
    const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, item.diaVencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffTime = dataVencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calcularResumoDoMes(contasDoMes: Conta[]) {
    let somaDespesas = 0;
    let somaReceitas = 0;
    let somaAPagar = 0;
    const chartReceitasMap = new Map<string, number>();
    const chartDespesasMap = new Map<string, number>();

    contasDoMes.forEach(c => {
      if (c.valor) {
        const numValue = parseFloatValor(c.valor);
        if (!isNaN(numValue) && numValue > 0) {
          if (c.tipo === 'Despesa') {
            somaDespesas += numValue;
            if (!c.statusPago) {
              somaAPagar += numValue;
            }
            const label = `D - ${c.categoria || 'Outros'}`;
            chartDespesasMap.set(label, (chartDespesasMap.get(label) || 0) + numValue);
          }
          if (c.tipo === 'Receita') {
            somaReceitas += numValue;
            const label = `R - ${c.categoria || 'Outros'}`;
            chartReceitasMap.set(label, (chartReceitasMap.get(label) || 0) + numValue);
          }
        }
      }
    });

    const topReceitas = Array.from(chartReceitasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topDespesas = Array.from(chartDespesasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      somaDespesas,
      somaReceitas,
      somaAPagar,
      topReceitas,
      topDespesas
    };
  }
}
