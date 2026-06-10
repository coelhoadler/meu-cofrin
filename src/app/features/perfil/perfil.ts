import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private authService = inject(AuthService);
  private storage = inject(Storage);
  
  user = this.authService.currentUser;
  
  displayName = signal('');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  newPassword = signal('');
  isPasswordLoading = signal(false);
  passwordSuccessMessage = signal('');
  passwordErrorMessage = signal('');

  isUploading = signal(false);

  ngOnInit() {
    const currentUser = this.user();
    if (currentUser?.displayName) {
      this.displayName.set(currentUser.displayName);
    }
  }

  async saveProfile() {
    if (!this.displayName().trim()) {
      this.errorMessage.set('O nome não pode estar vazio.');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    
    try {
      await this.authService.updateCurrentUserProfile({
        displayName: this.displayName()
      });
      this.successMessage.set('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Erro ao atualizar o perfil. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async changePassword() {
    if (!this.newPassword().trim() || this.newPassword().length < 6) {
      this.passwordErrorMessage.set('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    this.isPasswordLoading.set(true);
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');

    try {
      await this.authService.updateUserPassword(this.newPassword());
      this.passwordSuccessMessage.set('Senha atualizada com sucesso!');
      this.newPassword.set('');
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'auth/requires-recent-login') {
        this.passwordErrorMessage.set('Por segurança, faça login novamente para alterar a senha.');
      } else {
        this.passwordErrorMessage.set('Erro ao atualizar a senha. Tente novamente.');
      }
    } finally {
      this.isPasswordLoading.set(false);
    }
  }

  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const userId = this.user()?.uid;
      if (!userId) throw new Error('Usuário não encontrado');
      
      const filePath = `profile_images/${userId}_${Date.now()}`;
      const storageRef = ref(this.storage, filePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await this.authService.updateCurrentUserProfile({ photoURL: downloadURL });
      this.successMessage.set('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Erro ao fazer upload da imagem.');
    } finally {
      this.isUploading.set(false);
      event.target.value = ''; // Reset input to allow re-upload
    }
  }
}
