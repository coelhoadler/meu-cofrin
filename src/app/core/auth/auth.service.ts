import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User, updateProfile, updatePassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, linkWithPhoneNumber, ConfirmationResult, applyActionCode, reload, deleteUser } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, listAll, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
      if (user) {
        this.updateLastAccessDate(user.uid);
      }
    });
  }

  private async updateLastAccessDate(uid: string) {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userDocRef, { lastAccessAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Erro ao atualizar a última data de acesso do usuário:', error);
    }
  }

  async saveUserProfile(user: User) {
    try {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const perfil = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        providerId: user.providerId
      };
      await setDoc(userDocRef, { perfil }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar o perfil do usuário:', error);
    }
  }

  async getCurrentUserAsync(): Promise<User | null> {
    return firstValueFrom(authState(this.auth));
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async signup(email: string, password: string, displayName: string | null | undefined) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      try {
        await sendEmailVerification(userCredential.user);
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de verificação no cadastro:', emailError);
      }

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    localStorage.removeItem('lancamentosFiltros');
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  async updateCurrentUserProfile(data: { displayName?: string | null, photoURL?: string | null }) {
    if (this.auth.currentUser) {
      await updateProfile(this.auth.currentUser, data);

      // Update signal manually since updateProfile might not trigger authState
      const currentUser = this.auth.currentUser;
      const updatedUser = {
        ...currentUser,
        displayName: data.displayName !== undefined ? data.displayName : currentUser.displayName,
        photoURL: data.photoURL !== undefined ? data.photoURL : currentUser.photoURL
      } as User;

      this.currentUser.set(updatedUser);
    } else {
      throw new Error('Nenhum usuário autenticado');
    }
  }

  async updateUserPassword(newPassword: string) {
    if (this.auth.currentUser) {
      await updatePassword(this.auth.currentUser, newPassword);
    } else {
      throw new Error('Nenhum usuário autenticado');
    }
  }

  async sendVerificationEmail() {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser);
    } else {
      throw new Error('Nenhum usuário autenticado');
    }
  }

  setupRecaptcha(containerId: string) {
    return new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible'
    });
  }

  async linkPhoneNumber(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    if (this.auth.currentUser) {
      return await linkWithPhoneNumber(this.auth.currentUser, phoneNumber, recaptchaVerifier);
    } else {
      throw new Error('Nenhum usuário autenticado');
    }
  }

  async verifyEmailCode(oobCode: string): Promise<void> {
    await applyActionCode(this.auth, oobCode);
    if (this.auth.currentUser) {
      await reload(this.auth.currentUser);
      this.currentUser.set(this.auth.currentUser);
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

  private async deleteUserStorageFiles(uid: string, photoURL?: string | null): Promise<void> {
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

  private async deleteUserFirestoreData(uid: string): Promise<void> {
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

  async deleteUserAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Nenhum usuário autenticado.');

    const uid = user.uid;
    const photoURL = user.photoURL;

    // 1. Remover documentos do Firestore
    await this.deleteUserFirestoreData(uid);

    // 2. Remover arquivos do Storage
    await this.deleteUserStorageFiles(uid, photoURL);

    // 3. Excluir conta de autenticação
    await deleteUser(user);

    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
