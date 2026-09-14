import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, orderBy, getDocs, doc, getDoc, limit } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { ResumoMensal } from '../models/resumo-mensal.model';
import { CacheEntry } from '../models/conta.model';

@Injectable({
  providedIn: 'root'
})
export class ResumoMensalService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly CACHE_TTL = 5 * 60 * 1000;
  private cacheResumos = new Map<number, CacheEntry<ResumoMensal[]>>();

  public invalidateCache(): void {
    this.cacheResumos.clear();
  }

  async getResumosMensais(limite: number = 6): Promise<ResumoMensal[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return [];

    const now = Date.now();
    const cached = this.cacheResumos.get(limite);
    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return [...cached.data];
    }

    const resumosRef = collection(this.firestore, `users/${user.uid}/resumosMensais`);

    const q = query(
      resumosRef,
      orderBy('__name__', 'desc'),
      limit(limite)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ResumoMensal));

    this.cacheResumos.set(limite, {
      data: [...items],
      timestamp: now
    });

    return items;
  }

  async getResumoMensalById(id: string): Promise<ResumoMensal | null> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return null;

    const docRef = doc(this.firestore, `users/${user.uid}/resumosMensais`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ResumoMensal;
    }
    return null;
  }
}
