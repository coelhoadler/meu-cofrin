import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { Conta } from '../models/conta.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelamentoService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  async getContasByParcelamentoId(parcelamentoId: string): Promise<Conta[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      return [];
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    const q = query(
      contasRef,
      where('parcelamentoId', '==', parcelamentoId)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Conta));

    // Ordenar pelo numeroParcela
    items.sort((a, b) => (a.numeroParcela || 0) - (b.numeroParcela || 0));

    return items;
  }

  async addContasParceladas(contas: Conta[], file?: File | null): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    let reciboUrl = '';

    if (file) {
      const timestamp = new Date().getTime();
      const filePath = `users/${user.uid}/receipts/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      const snapshot = await uploadBytes(storageRef, file, {
        cacheControl: 'public, max-age=2592000, immutable'
      });
      reciboUrl = await getDownloadURL(snapshot.ref);
    }

    const contasRef = collection(this.firestore, `users/${user.uid}/contas`);
    const batch = writeBatch(this.firestore);

    for (const conta of contas) {
      const dataToSave = {
        ...conta,
        ...(reciboUrl ? { reciboUrl } : {}),
        createdAt: serverTimestamp()
      };
      const newDocRef = doc(contasRef);
      batch.set(newDocRef, dataToSave);
    }

    await batch.commit();
  }

  async updateContasParceladas(contas: Conta[], file?: File | null): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    let reciboUrl = contas[0]?.reciboUrl || '';

    if (file) {
      const timestamp = new Date().getTime();
      const filePath = `users/${user.uid}/receipts/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      const snapshot = await uploadBytes(storageRef, file, {
        cacheControl: 'public, max-age=2592000, immutable'
      });
      reciboUrl = await getDownloadURL(snapshot.ref);
    }

    const batch = writeBatch(this.firestore);

    for (const conta of contas) {
      if (conta.id) {
        const docRef = doc(this.firestore, `users/${user.uid}/contas`, conta.id);
        const dataToUpdate = {
          ...conta,
          ...(reciboUrl ? { reciboUrl } : {})
        };
        delete dataToUpdate.id;
        batch.update(docRef, dataToUpdate);
      }
    }

    await batch.commit();
  }

  async deleteContasByParcelamentoId(parcelamentoId: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const contas = await this.getContasByParcelamentoId(parcelamentoId);
    const batch = writeBatch(this.firestore);

    for (const conta of contas) {
      if (conta.id) {
        const docRef = doc(this.firestore, `users/${user.uid}/contas`, conta.id);

        // Remove recibo do Storage se existir
        if (conta.reciboUrl) {
          try {
            const fileRef = ref(this.storage, conta.reciboUrl);
            await deleteObject(fileRef);
          } catch (error) {
            console.error('Erro ao deletar recibo da parcela:', error);
          }
        }

        batch.delete(docRef);
      }
    }

    await batch.commit();
  }
}
