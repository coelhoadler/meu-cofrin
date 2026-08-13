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

export const CATEGORIA_ICONS: string[] = [
  'sell',
  'home',
  'shopping_cart',
  'directions_car',
  'restaurant',
  'favorite',
  'school',
  'flight',
  'fitness_center',
  'redeem',
  'wifi',
  'smartphone',
  'bolt',
  'water_drop',
  'checkroom',
  'pets',
  'child_care',
  'work',
  'savings',
  'credit_card',
  'account_balance_wallet',
  'movie',
  'music_note',
  'coffee',
  'local_gas_station',
  'build',
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
