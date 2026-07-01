import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc, deleteField, limit } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

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
}

export interface ResumoMensal {
  id: string; // YYYY-MM
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  atualizadoEm?: any;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  // Configuração de Cache
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos de TTL
  private cacheLancamentosRecentes: CacheEntry<Conta[]> | null = null;
  private cacheContasPorMes = new Map<string, CacheEntry<Conta[]>>();
  private cacheResumos = new Map<number, CacheEntry<ResumoMensal[]>>();
  private cacheContasById = new Map<string, CacheEntry<Conta>>();

  public invalidateCache(): void {
    this.cacheLancamentosRecentes = null;
    this.cacheContasPorMes.clear();
    this.cacheResumos.clear();
    this.cacheContasById.clear();
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

  async removeRecibo(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);

    // Buscar o documento para pegar a URL do recibo e deletar do Storage
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const conta = docSnap.data() as Conta;
      if (conta.reciboUrl) {
        try {
          const fileRef = ref(this.storage, conta.reciboUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Erro ao deletar arquivo do Storage:', error);
        }
      }
    }

    await updateDoc(docRef, { reciboUrl: deleteField() });

    this.invalidateCache();
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

    // Buscar ordenando pelo ID do documento (que é YYYY-MM) de forma descendente
    const q = query(
      resumosRef,
      orderBy('__name__', 'desc'),
      limit(limite)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as ResumoMensal;
    });

    this.cacheResumos.set(limite, {
      data: [...items],
      timestamp: now
    });

    return items;
  }

  async marcarComoPaga(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataPagamentoStr = `${ano}-${mes}-${dia}`;

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    await updateDoc(docRef, { statusPago: true, dataPagamento: dataPagamentoStr });
    this.invalidateCache();
  }
}
