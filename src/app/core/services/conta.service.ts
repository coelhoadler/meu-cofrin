import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc, deleteField, limit } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

import { Conta, CacheEntry } from '../models/conta.model';
import { ResumoMensal } from '../models/resumo-mensal.model';
export type { Conta, ResumoMensal, CacheEntry };



import { ParcelamentoService } from './parcelamento.service';
import { ResumoMensalService } from './resumo-mensal.service';
import { ReciboService } from './recibo.service';

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private parcelamentoService = inject(ParcelamentoService);
  private resumoMensalService = inject(ResumoMensalService);
  private reciboService = inject(ReciboService);

  // Configuração de Cache
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos de TTL
  private cacheLancamentosRecentes: CacheEntry<Conta[]> | null = null;
  private cacheContasPorMes = new Map<string, CacheEntry<Conta[]>>();
  private cacheContasById = new Map<string, CacheEntry<Conta>>();

  public invalidateCache(): void {
    this.cacheLancamentosRecentes = null;
    this.cacheContasPorMes.clear();
    this.cacheContasById.clear();
    this.resumoMensalService.invalidateCache();
  }

  async addConta(contaData: Conta, file?: File | null): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    let reciboUrl = '';

    if (file) {
      // Upload file to Storage
      const timestamp = new Date().getTime();
      const filePath = `users/${user.uid}/receipts/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, filePath);

      const snapshot = await uploadBytes(storageRef, file);
      reciboUrl = await getDownloadURL(snapshot.ref);
    }

    // Prepare data to save
    const dataToSave = {
      ...contaData,
      ...(reciboUrl ? { reciboUrl } : {}),
      createdAt: serverTimestamp()
    };

    // Save to Firestore
    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    await addDoc(contasRef, dataToSave);

    this.invalidateCache();
  }

  async getLancamentosRecentes(): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const now = Date.now();
    if (this.cacheLancamentosRecentes && (now - this.cacheLancamentosRecentes.timestamp < this.CACHE_TTL)) {
      return [...this.cacheLancamentosRecentes.data];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);

    const dataAtual = new Date();
    const mesAtualStr = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;

    const q = query(
      contasRef,
      where('mesReferencia', '==', mesAtualStr),
      limit(30)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Conta;
    });

    // Ordena: Pendentes (false) primeiro e depois por diaVencimento (crescente)
    items.sort((a, b) => {
      if (a.statusPago === b.statusPago) {
        return a.diaVencimento - b.diaVencimento;
      }
      return a.statusPago ? 1 : -1;
    });

    this.cacheLancamentosRecentes = {
      data: [...items],
      timestamp: now
    };

    return items;
  }

  async buscarContasPorNome(nome: string): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    // Busca abrangente ordenada pela data de criação
    const q = query(contasRef, orderBy('createdAt', 'desc'), limit(1000));

    const querySnapshot = await getDocs(q);
    const termo = nome.toLowerCase().trim();

    const items = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Conta;
    }).filter(c => c.nome.toLowerCase().includes(termo));

    return items;
  }

  async getContasByMesReferencia(mesReferencia: string): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const now = Date.now();
    const cached = this.cacheContasPorMes.get(mesReferencia);
    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return [...cached.data];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    const q = query(
      contasRef,
      where('mesReferencia', '==', mesReferencia)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Conta;
    });

    this.cacheContasPorMes.set(mesReferencia, {
      data: [...items],
      timestamp: now
    });

    return items;
  }

  async getContasByAno(ano: string, limitNum: number = 50): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    const q = query(
      contasRef,
      where('mesReferencia', '>=', `${ano}-01`),
      where('mesReferencia', '<=', `${ano}-12`),
      limit(limitNum)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Conta;
    });

    return items;
  }

  async getContaById(id: string): Promise<Conta | null> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return null;

    const now = Date.now();
    const cached = this.cacheContasById.get(id);
    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return { ...cached.data };
    }

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const conta = { id: docSnap.id, ...docSnap.data() } as Conta;
      this.cacheContasById.set(id, {
        data: { ...conta },
        timestamp: now
      });
      return conta;
    }
    return null;
  }

  async getContasByParcelamentoId(parcelamentoId: string): Promise<Conta[]> {
    return this.parcelamentoService.getContasByParcelamentoId(parcelamentoId);
  }

  async addContasParceladas(contas: Conta[], file?: File | null): Promise<void> {
    await this.parcelamentoService.addContasParceladas(contas, file);
    this.invalidateCache();
  }

  async updateContasParceladas(contas: Conta[], file?: File | null): Promise<void> {
    await this.parcelamentoService.updateContasParceladas(contas, file);
    this.invalidateCache();
  }

  async updateConta(id: string, contaData: Partial<Conta>, file?: File | null): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    let reciboUrl = contaData.reciboUrl || '';

    if (file) {
      const timestamp = new Date().getTime();
      const filePath = `users/${user.uid}/receipts/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      reciboUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    const dataToUpdate = {
      ...contaData,
      ...(reciboUrl ? { reciboUrl } : {})
    };

    // Remove id before updating
    delete dataToUpdate.id;

    await updateDoc(docRef, dataToUpdate);

    this.invalidateCache();
  }

  async deleteConta(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);

    // Remove o recibo do Storage se existir, para não deixar arquivos órfãos
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const conta = docSnap.data() as Conta;
      if (conta.reciboUrl) {
        try {
          const fileRef = ref(this.storage, conta.reciboUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Erro ao deletar arquivo do Storage na exclusão da conta:', error);
        }
      }
    }

    await deleteDoc(docRef);

    this.invalidateCache();
  }

  async deleteContasByParcelamentoId(parcelamentoId: string): Promise<void> {
    await this.parcelamentoService.deleteContasByParcelamentoId(parcelamentoId);
    this.invalidateCache();
  }

  async removeRecibo(id: string): Promise<void> {
    await this.reciboService.removeRecibo(id);
    this.invalidateCache();
  }

  async getResumosMensais(limite: number = 6): Promise<ResumoMensal[]> {
    return this.resumoMensalService.getResumosMensais(limite);
  }

  async getResumoMensalById(id: string): Promise<ResumoMensal | null> {
    return this.resumoMensalService.getResumoMensalById(id);
  }

  async marcarComoPaga(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const dataPagamentoStr = new Date().toISOString();

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    await updateDoc(docRef, { statusPago: true, dataPagamento: dataPagamentoStr });
    this.invalidateCache();
  }
}
