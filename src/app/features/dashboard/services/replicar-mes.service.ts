import { Injectable, inject } from '@angular/core';
import { ContaService } from '../../../core/services/conta.service';
import { Conta } from '../../../core/models/conta.model';

export type ContaReplicavel = Conta & {
  existsInDestino?: boolean;
  selected?: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class ReplicarMesService {
  private contaService = inject(ContaService);

  async loadContasParaReplicar(origem: Date, destino: Date): Promise<ContaReplicavel[]> {
    const mesOrigemStr = `${origem.getFullYear()}-${String(origem.getMonth() + 1).padStart(2, '0')}`;
    const mesDestinoStr = `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}`;

    const contasOrigem = await this.contaService.getContasByMesReferencia(mesOrigemStr);
    let contasDestino: Conta[] = [];

    if (mesOrigemStr !== mesDestinoStr) {
      contasDestino = await this.contaService.getContasByMesReferencia(mesDestinoStr);
    }

    const contasRecorrentes = contasOrigem.filter(c => c.isRecorrente);

    return contasRecorrentes.map(conta => {
      const exists = mesOrigemStr === mesDestinoStr || contasDestino.some(d => d.nome === conta.nome && d.diaVencimento === conta.diaVencimento);
      return {
        ...conta,
        existsInDestino: exists,
        selected: !exists
      };
    }).sort((a, b) => a.diaVencimento - b.diaVencimento);
  }

  async replicarContas(contasSelecionadas: ContaReplicavel[], mesDestinoStr: string): Promise<void> {
    const promises = contasSelecionadas.map(conta => {
      const novaConta: any = { ...conta };
      delete novaConta.id;
      delete novaConta.existsInDestino;
      delete novaConta.selected;

      novaConta.mesReferencia = mesDestinoStr;
      novaConta.statusPago = false;
      novaConta.dataPagamento = null;
      novaConta.reciboUrl = '';
      novaConta.valorAntigo = conta.valor;

      return this.contaService.addConta(novaConta);
    });

    await Promise.all(promises);
  }
}
