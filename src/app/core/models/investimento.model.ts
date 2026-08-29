export interface Investimento {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: string; // 'CDB', 'Criptomoedas', 'Poupança', 'Tesouro Direto', 'Previdência Privada'
  dataVencimento?: string | Date;
  instituicao: string; // 'Banco XP', 'Nubank', 'Itaú', 'Outros'
  instituicaoOutros?: string;
  aporteInicial: number;
  valorAtual: number;
  criadoEm: string | Date;
}

export interface RegistroInvestimento {
  id?: string;
  data: string | Date;
  valor: number;
  anotacao?: string;
}
