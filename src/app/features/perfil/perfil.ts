import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private authService = inject(AuthService);
  
  user = this.authService.currentUser;
  
  displayName = signal('');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

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
}
