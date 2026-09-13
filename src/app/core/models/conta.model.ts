export interface Conta {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'Despesa' | 'Receita';
  mesReferencia: string;
  diaVencimento: number;
  dataPagamento?: string | null;
  statusPago: boolean;
  valor: string | null;
  reciboUrl?: string;
  categoria?: string;
  createdAt?: any;
  isRecorrente?: boolean;
  valorAntigo?: string | null;
  parcelamentoId?: string;
  numeroParcela?: number;
  totalParcelas?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
