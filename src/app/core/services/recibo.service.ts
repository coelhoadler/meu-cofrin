import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, deleteField } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { Conta } from '../models/conta.model';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  async uploadRecibo(uid: string, file: File): Promise<string> {
    const timestamp = new Date().getTime();
    const filePath = `users/${uid}/receipts/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async deleteReciboFile(reciboUrl: string): Promise<void> {
    try {
      const fileRef = ref(this.storage, reciboUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Erro ao deletar arquivo do Storage:', error);
    }
  }

  async removeRecibo(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/contas`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const conta = docSnap.data() as Conta;
      if (conta.reciboUrl) {
        await this.deleteReciboFile(conta.reciboUrl);
      }
    }

    await updateDoc(docRef, { reciboUrl: deleteField() });
  }
}
