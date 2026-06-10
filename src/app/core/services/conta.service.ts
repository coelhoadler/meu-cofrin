import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc, deleteField, limit } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
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
}

export interface ResumoMensal {
  id: string; // YYYY-MM
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  atualizadoEm?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

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
  }

  async getLancamentosRecentes(): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);

    // Calculate date 15 days ago
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 15);

    const q = query(
      contasRef,
      where('createdAt', '>=', dataLimite),
      orderBy('createdAt', 'desc')
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

    return items;
  }

  async getContasByMesReferencia(mesReferencia: string): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    const q = query(
      contasRef,
      where('mesReferencia', '==', mesReferencia)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Conta;
    });
  }

  async getContaById(id: string): Promise<Conta | null> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return null;

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Conta;
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
  }

  async deleteConta(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    await deleteDoc(docRef);
  }

  async removeRecibo(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    await updateDoc(docRef, { reciboUrl: deleteField() });
  }

  async getResumosMensais(limite: number = 6): Promise<ResumoMensal[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return [];

    const resumosRef = collection(this.firestore, `users/${user.uid}/resumosMensais`);
    
    // Buscar ordenando pelo ID do documento (que é YYYY-MM) de forma descendente
    const q = query(
      resumosRef,
      orderBy('__name__', 'desc'),
      limit(limite)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as ResumoMensal;
    });
  }
}
