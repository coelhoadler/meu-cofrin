import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private firestore = inject(Firestore);

  async isEmpresaAccount(uid: string): Promise<boolean> {
    // 1. Tenta verificar na coleção dedicada 'companies/{uid}'
    try {
      const companyDoc = await getDoc(doc(this.firestore, `companies/${uid}`));
      if (companyDoc.exists()) {
        return true;
      }
    } catch (e) {
      // Ignora erro caso a regra bloqueie
    }

    // 2. Tenta verificar no documento do usuário em 'users/{uid}'
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (
          data?.['companies'] ||
          data?.['perfil']?.tipo === 'empresa' ||
          data?.['tipo'] === 'empresa'
        ) {
          return true;
        }
      }
    } catch (e) {
      console.error('Erro ao verificar se conta é de empresa no Firestore:', e);
    }

    return false;
  }
}
