import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

import { Categoria, CategoriaIconOption, CATEGORIA_ICONS } from '../models/categoria.model';
import { CacheEntry } from '../models/conta.model';
export type { Categoria, CategoriaIconOption };
export { CATEGORIA_ICONS };

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly CACHE_TTL = 5 * 60 * 1000;
  private cacheCategorias = new Map<string, CacheEntry<Categoria[]>>();
  private inFlightCategorias = new Map<string, Promise<Categoria[]>>();

  public invalidateCache(uid?: string): void {
    if (uid) {
      this.cacheCategorias.delete(uid);
    } else {
      this.cacheCategorias.clear();
    }
  }

  async addCategoria(categoriaData: Categoria): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const dataToSave = {
      ...categoriaData,
      createdAt: serverTimestamp(),
    };

    const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
    await addDoc(categoriasRef, dataToSave);
    this.invalidateCache(user.uid);
  }

  async getCategorias(): Promise<Categoria[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const now = Date.now();
    const cached = this.cacheCategorias.get(user.uid);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return [...cached.data];
    }

    const inFlight = this.inFlightCategorias.get(user.uid);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = (async () => {
      try {
        const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
        const q = query(categoriasRef, orderBy('tipo', 'desc'));

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as Categoria;
        });

        this.cacheCategorias.set(user.uid, {
          data: [...items],
          timestamp: Date.now(),
        });

        return items;
      } finally {
        this.inFlightCategorias.delete(user.uid);
      }
    })();

    this.inFlightCategorias.set(user.uid, fetchPromise);
    return fetchPromise;
  }

  async updateCategoria(id: string, categoriaData: Partial<Categoria>): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/categorias`, id);
    const dataToUpdate = { ...categoriaData };
    delete dataToUpdate.id; // avoid updating id field

    await updateDoc(docRef, dataToUpdate);
    this.invalidateCache(user.uid);
  }

  async deleteCategoria(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/categorias`, id);
    await deleteDoc(docRef);
    this.invalidateCache(user.uid);
  }
}
