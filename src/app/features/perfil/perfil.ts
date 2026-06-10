import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  isUploading = signal(false);
  biometricsEnabled = signal(false);
  isSendingEmail = signal(false);

  ngOnInit() {
    const currentUser = this.user();
    if (currentUser?.displayName) {
      this.displayName.set(currentUser.displayName);
    }

    const storedBiometrics = localStorage.getItem('biometricsEnabled');
    if (storedBiometrics === 'true') {
      this.biometricsEnabled.set(true);
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

  toggleBiometrics() {
    this.biometricsEnabled.update(v => !v);
    localStorage.setItem('biometricsEnabled', this.biometricsEnabled().toString());
    
    // Futura integração com WebAuthn/Passkeys pode ser adicionada aqui
    if (this.biometricsEnabled()) {
      console.log('Biometria habilitada no dispositivo local.');
    } else {
      console.log('Biometria desabilitada.');
    }
  }

  async resendVerificationEmail() {
    this.isSendingEmail.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.sendVerificationEmail();
      this.successMessage.set('E-mail de verificação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'auth/too-many-requests') {
        this.errorMessage.set('Muitos pedidos recentes. Tente novamente mais tarde.');
      } else {
        this.errorMessage.set('Erro ao enviar o e-mail de verificação. Tente novamente.');
      }
    } finally {
      this.isSendingEmail.set(false);
    }
  }
}
