import { Injectable, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { Storage, ref, listAll, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  async updateLastAccessDate(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userDocRef, { lastAccessAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Erro ao atualizar a última data de acesso do usuário:', error);
    }
  }

  async saveUserProfile(user: User): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        'perfil.displayName': user.displayName,
        'perfil.email': user.email,
        'perfil.photoURL': user.photoURL,
        'perfil.phoneNumber': user.phoneNumber,
        'perfil.providerId': user.providerId
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar o perfil do usuário:', error);
    }
  }

  private async deleteStorageFolder(folderPath: string): Promise<void> {
    try {
      const folderRef = ref(this.storage, folderPath);
      const res = await listAll(folderRef);
      for (const item of res.items) {
        await deleteObject(item);
      }
      for (const prefix of res.prefixes) {
        await this.deleteStorageFolder(prefix.fullPath);
      }
    } catch (e) {
      console.warn(`Erro ao excluir pasta no Storage (${folderPath}):`, e);
    }
  }

  async deleteUserStorageFiles(uid: string, photoURL?: string | null): Promise<void> {
    await this.deleteStorageFolder(`users/${uid}`);

    try {
      const profileImagesRef = ref(this.storage, 'profile_images');
      const res = await listAll(profileImagesRef);
      for (const item of res.items) {
        if (item.name.startsWith(uid)) {
          await deleteObject(item);
        }
      }
    } catch (e) {
      console.warn('Erro ao limpar foto de perfil no Storage:', e);
    }

    if (photoURL) {
      try {
        const photoRef = ref(this.storage, photoURL);
        await deleteObject(photoRef);
      } catch (e) {
        // Ignorado se o arquivo já foi removido
      }
    }
  }

  // Subcoleções de users/{uid}, com as subcoleções de cada documento. O SDK web não
  // lista subcoleções, então toda subcoleção nova precisa ser declarada aqui.
  private readonly userSubcollections: Record<string, string[]> = {
    contas: [],
    resumosMensais: [],
    categorias: [],
    desejos: [],
    passkeys: [],
    investimentos: ['registros']
  };

  private async deleteCollection(path: string, nestedSubcollections: string[] = []): Promise<void> {
    const snapshot = await getDocs(collection(this.firestore, path));

    // Apagar um documento não apaga suas subcoleções, então elas vão primeiro
    for (const docItem of snapshot.docs) {
      for (const nested of nestedSubcollections) {
        await this.deleteCollection(`${docItem.ref.path}/${nested}`);
      }
    }

    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(this.firestore);
      for (const docItem of snapshot.docs.slice(i, i + 500)) {
        batch.delete(docItem.ref);
      }
      await batch.commit();
    }
  }

  async deleteUserFirestoreData(uid: string): Promise<void> {
    for (const [sub, nestedSubcollections] of Object.entries(this.userSubcollections)) {
      try {
        await this.deleteCollection(`users/${uid}/${sub}`, nestedSubcollections);
      } catch (e) {
        console.warn(`Erro ao apagar subcoleção ${sub}:`, e);
      }
    }

    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await deleteDoc(userDocRef);
    } catch (e) {
      console.warn('Erro ao apagar documento principal do usuário no Firestore:', e);
    }

    try {
      const companyDocRef = doc(this.firestore, `companies/${uid}`);
      await deleteDoc(companyDocRef);
    } catch (e) {
      console.warn('Erro ao apagar documento da empresa no Firestore:', e);
    }
  }
}
