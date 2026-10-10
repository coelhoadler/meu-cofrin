export type DesejoCategoria =
  | 'Eletrônico'
  | 'Casa'
  | 'Celular'
  | 'Entretenimento'
  | 'Vídeo game'
  | 'Alimentação'
  | 'Compras';

export const DESEJO_CATEGORIAS: DesejoCategoria[] = [
  'Eletrônico',
  'Casa',
  'Celular',
  'Entretenimento',
  'Vídeo game',
  'Alimentação',
  'Compras'
];

export const DESEJO_CATEGORIA_ICONS: Record<DesejoCategoria, string> = {
  'Eletrônico': 'devices',
  'Casa': 'home',
  'Celular': 'smartphone',
  'Entretenimento': 'movie',
  'Vídeo game': 'sports_esports',
  'Alimentação': 'restaurant',
  'Compras': 'shopping_bag'
};

export interface DesejoLink {
  id: string;
  url: string;
  loja?: string;
  preco: number;
  observacao?: string;
  criadoEm?: any;
}

export interface DesejoRealizacao {
  valorPago: number;
  descricao?: string;
  /** Data/hora em que o desejo foi realizado (ISO string, informado pelo usuário). */
  realizadoEm: string;
  /** Data/hora em que o registro foi salvo (ISO string). */
  registradoEm: string;
}

export interface Desejo {
  id?: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  imagemPath?: string;
  categoria: DesejoCategoria;
  links?: DesejoLink[];
  menorPreco?: number | null;
  maiorPreco?: number | null;
  /** Presente quando o desejo foi realizado. */
  realizacao?: DesejoRealizacao | null;
  criadoEm?: any;
  atualizadoEm?: any;
}
