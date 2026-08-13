import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

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

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  async addCategoria(categoriaData: Categoria): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const dataToSave = {
      ...categoriaData,
      createdAt: serverTimestamp()
    };

    const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
    await addDoc(categoriasRef, dataToSave);
  }

  async getCategorias(): Promise<Categoria[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
    const q = query(categoriasRef, orderBy('tipo', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Categoria;
    });
  }

  async updateCategoria(id: string, categoriaData: Partial<Categoria>): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/categorias`, id);
    const dataToUpdate = { ...categoriaData };
    delete dataToUpdate.id; // avoid updating id field

    await updateDoc(docRef, dataToUpdate);
  }

  async deleteCategoria(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/categorias`, id);
    await deleteDoc(docRef);
  }
}
