import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

export interface Conta {
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
}
