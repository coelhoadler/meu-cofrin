import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User, updateProfile, updatePassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, linkWithPhoneNumber, ConfirmationResult, applyActionCode, reload, deleteUser } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { SESSION_DURATION_MS } from './session.config';
import { UserDataService } from '../services/user-data.service';
import { EmpresaService } from '../../features/empresas/services/empresa.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userDataService = inject(UserDataService);
  private empresaService = inject(EmpresaService);

  currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    authState(this.auth).subscribe(async (user) => {
      if (user) {
        this.currentUser.set(user);
        this.updateLastAccessDate(user.uid);
      } else {
        this.currentUser.set(null);
      }
    });

    this.initVisibilityListener();
  }

  async isSessionExpired(user: User): Promise<boolean> {
    try {
      const idTokenResult = await user.getIdTokenResult();
      const authTime = Number(idTokenResult?.claims['auth_time'] || 0) * 1000;
      const now = Date.now();

      return authTime === 0 || (now - authTime > SESSION_DURATION_MS);
    } catch (error) {
      console.error('Erro ao verificar validade da sessão:', error);
      return true;
    }
  }

  async checkAndHandleSessionExpiration(user?: User | null): Promise<boolean> {
    const targetUser = user ?? this.auth.currentUser;
    if (!targetUser) return false;

    const expired = await this.isSessionExpired(targetUser);
    if (expired) {
      await this.logout();
      return true;
    }
    return false;
  }

  private initVisibilityListener() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const handleVisibilityOrFocus = () => {
        if (document.visibilityState === 'visible') {
          this.checkAndHandleSessionExpiration();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }
  }

  private async updateLastAccessDate(uid: string) {
    return this.userDataService.updateLastAccessDate(uid);
  }

  async saveUserProfile(user: User) {
    return this.userDataService.saveUserProfile(user);
  }

  async isEmpresaAccount(uid: string): Promise<boolean> {
    return this.empresaService.isEmpresaAccount(uid);
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
    const isEmpresasRoute = this.router.url.startsWith('/empresas');
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate([isEmpresasRoute ? '/empresas/login' : '/login']);
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

  async deleteUserAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Nenhum usuário autenticado.');

    const uid = user.uid;
    const photoURL = user.photoURL;

    // 1. Remover documentos do Firestore
    await this.userDataService.deleteUserFirestoreData(uid);

    // 2. Remover arquivos do Storage
    await this.userDataService.deleteUserStorageFiles(uid, photoURL);

    // 3. Excluir conta de autenticação
    await deleteUser(user);

    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}

