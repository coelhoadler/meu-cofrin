import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private firestore = inject(Firestore);

  async isEmpresaAccount(uid: string): Promise<boolean> {
    try {
      const companyDoc = await getDoc(doc(this.firestore, `companies/${uid}`));
      return companyDoc.exists();
    } catch (e) {
      console.error('Erro ao verificar se conta é de empresa no Firestore:', e);
      return false;
    }
  }
}
