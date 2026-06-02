import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

export interface Conta {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'Despesa' | 'Receita';
  categoria: string;
  diaVencimento: number;
  dataPagamento?: string | null;
  statusPago: boolean;
  valor: string | null;
  reciboUrl?: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  async addConta(contaData: Conta, file?: File | null): Promise<void> {
    const user = this.authService.currentUser();
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
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);

    // Calculate date 15 days ago
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 15);

    // Note: To use orderBy and where together on the same field, Firestore might require an index. 
    // Since this is a simple inequality on createdAt and ordering by createdAt, it might work without a composite index, 
    // but just in case, we'll fetch ordered by createdAt desc and filter in memory if the query fails, or just rely on simple orderBy and filter on client to avoid index errors in MVP.
    // Actually, where('createdAt', '>=', dataLimite) and orderBy('createdAt', 'desc') is a single-field index, so it's supported by default!

    const q = query(
      contasRef,
      where('createdAt', '>=', dataLimite),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Conta;
    });
  }
}
