import { Injectable, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
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

  async deleteUserFirestoreData(uid: string): Promise<void> {
    const subcollections = ['contas', 'resumosMensais', 'categorias'];
    for (const sub of subcollections) {
      try {
        const subRef = collection(this.firestore, `users/${uid}/${sub}`);
        const snapshot = await getDocs(subRef);
        for (const docItem of snapshot.docs) {
          await deleteDoc(docItem.ref);
        }
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
  }
}
