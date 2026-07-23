import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { WebauthnService } from '../../core/auth/webauthn.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private storage = inject(Storage);
  private webauthnService = inject(WebauthnService);

  user = this.authService.currentUser;

  displayName = signal('');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  isUploading = signal(false);
  biometricsEnabled = signal(false);
  isSendingEmail = signal(false);

  phoneNumber = signal('');
  verificationCode = signal('');
  isSendingSms = signal(false);
  isVerifyingSms = signal(false);
  showSmsInput = signal(false);
  recaptchaVerifier: any;
  confirmationResult: any;

  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        if (currentUser.displayName && !this.displayName()) {
          this.displayName.set(currentUser.displayName);
        }
        if (currentUser.phoneNumber && !this.phoneNumber()) {
          const phone = currentUser.phoneNumber;
          this.phoneNumber.set(phone.startsWith('+55') ? phone.replace('+55', '') : phone);
        }
      }
    });
  }

  ngOnInit() {
    const storedBiometrics = localStorage.getItem('biometricsEnabled');
    if (storedBiometrics === 'true') {
      this.biometricsEnabled.set(true);
    }
  }

  ngOnDestroy() {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Erro ao limpar reCAPTCHA', e);
      }
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
        displayName: this.displayName(),
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

  async toggleBiometrics() {
    const previousState = this.biometricsEnabled();
    this.biometricsEnabled.update((v) => !v);

    if (this.biometricsEnabled()) {
      try {
        this.isLoading.set(true);
        this.errorMessage.set('');
        await this.webauthnService.registerPasskey();
        this.successMessage.set('Biometria habilitada com sucesso!');
        localStorage.setItem('biometricsEnabled', 'true');
        if (this.user()?.email) {
          localStorage.setItem('biometricEmail', this.user()?.email as string);
        }
      } catch (error: any) {
        console.error(error);
        this.biometricsEnabled.set(previousState); // revert
        this.errorMessage.set(error.message || 'Erro ao habilitar biometria.');
        localStorage.setItem('biometricsEnabled', 'false');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      // In a full implementation, you would call a cloud function to remove the credential from Firestore
      localStorage.setItem('biometricsEnabled', 'false');
      localStorage.removeItem('biometricEmail');
      this.successMessage.set('Biometria desabilitada para este dispositivo.');
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

  async sendSmsVerification() {
    const rawNumber = this.phoneNumber().replace(/\D/g, '');
    if (rawNumber.length < 10) {
      this.errorMessage.set('Informe um número de celular válido com DDD (ex: (11) 99999-9999).');
      return;
    }

    const fullNumber = `+55${rawNumber}`;

    this.isSendingSms.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      this.recaptchaVerifier = this.authService.setupRecaptcha('recaptcha-container');

      this.confirmationResult = await this.authService.linkPhoneNumber(fullNumber, this.recaptchaVerifier);
      this.showSmsInput.set(true);
      this.successMessage.set('SMS enviado! Insira o código recebido.');
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set(error.message || 'Erro ao enviar o SMS. Verifique o formato do número (+55...).');
    } finally {
      this.isSendingSms.set(false);
    }
  }

  async confirmSmsCode() {
    if (!this.verificationCode().trim()) {
      this.errorMessage.set('Informe o código recebido por SMS.');
      return;
    }

    this.isVerifyingSms.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.confirmationResult.confirm(this.verificationCode());
      this.successMessage.set('Celular verificado com sucesso! Notificações por WhatsApp poderão ser habilitadas.');
      this.showSmsInput.set(false);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Código inválido ou expirado. Tente novamente.');
    } finally {
      this.isVerifyingSms.set(false);
    }
  }
}
