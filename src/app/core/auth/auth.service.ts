import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User, updateProfile, updatePassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, linkWithPhoneNumber, ConfirmationResult, applyActionCode, reload } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);

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
}
