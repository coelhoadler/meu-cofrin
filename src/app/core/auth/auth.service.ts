import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
    });
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

  async signup(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
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
}
