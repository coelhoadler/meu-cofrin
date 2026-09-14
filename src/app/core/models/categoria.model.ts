export interface Categoria {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'Despesa' | 'Receita';
  icone?: string;
  cor?: string;
  createdAt?: any;
}

export interface CategoriaIconOption {
  name: string;
  title: string;
}

export const CATEGORIA_ICONS: CategoriaIconOption[] = [
  { name: 'sell', title: 'Geral / Outros' },
  { name: 'home', title: 'Moradia' },
  { name: 'shopping_cart', title: 'Mercado / Compras' },
  { name: 'directions_car', title: 'Transporte / Carro' },
  { name: 'restaurant', title: 'Alimentação / Restaurante' },
  { name: 'favorite', title: 'Saúde / Bem-estar' },
  { name: 'school', title: 'Educação' },
  { name: 'flight', title: 'Viagens' },
  { name: 'fitness_center', title: 'Academia / Esportes' },
  { name: 'redeem', title: 'Presentes / Doações' },
  { name: 'wifi', title: 'Internet / Assinaturas' },
  { name: 'smartphone', title: 'Celular / Telefonia' },
  { name: 'bolt', title: 'Luz / Energia' },
  { name: 'water_drop', title: 'Água / Saneamento' },
  { name: 'checkroom', title: 'Vestuário / Roupas' },
  { name: 'pets', title: 'Pets / Animais' },
  { name: 'child_care', title: 'Filhos / Bebê' },
  { name: 'work', title: 'Trabalho / Salário' },
  { name: 'savings', title: 'Investimentos / Poupança' },
  { name: 'credit_card', title: 'Cartão de Crédito' },
  { name: 'account_balance_wallet', title: 'Carteira / Finanças' },
  { name: 'movie', title: 'Entretenimento / Lazer' },
  { name: 'music_note', title: 'Música / Shows' },
  { name: 'coffee', title: 'Cafeteria / Lanches' },
  { name: 'local_gas_station', title: 'Combustível' },
  { name: 'build', title: 'Serviços / Manutenção' },
];
