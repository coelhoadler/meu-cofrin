export interface ResumoMensal {
  id: string; // YYYY-MM
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  atualizadoEm?: any;
}

export type Variacao = {
  percent: number;
  direction: 'up' | 'down' | 'none';
} | null;
