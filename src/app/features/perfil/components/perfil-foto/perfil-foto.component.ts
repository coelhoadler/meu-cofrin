import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-perfil-foto',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-white dark:bg-[#1a112c] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 transition-colors duration-300"
    >
      <div class="relative flex-shrink-0">
        @if (user()?.photoURL) {
          <img
            [src]="user()?.photoURL!"
            alt="Profile"
            class="w-36 h-36 rounded-full object-cover"
          />
        } @else {
          <div
            class="w-36 h-36 rounded-full bg-slate-200 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 dark:text-slate-400 text-3xl font-bold"
          >
            {{
              user()?.displayName?.charAt(0)?.toUpperCase() ||
                user()?.email?.charAt(0)?.toUpperCase() ||
                'U'
            }}
          </div>
        }

        <button
          type="button"
          (click)="fileInput.click()"
          class="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-[#130c25] border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">photo_camera</span>
        </button>

        @if (isUploading()) {
          <div class="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined animate-spin text-[#9b87f5] text-3xl"
              >progress_activity</span
            >
          </div>
        }

        <input
          type="file"
          #fileInput
          class="hidden"
          accept="image/jpeg, image/png, image/webp"
          (change)="uploadProfileImage($event)"
        />
      </div>

      <div class="text-center sm:text-left flex flex-col gap-1.5">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white leading-none">
          {{ user()?.displayName || 'Usuário sem nome' }}
        </h2>
      </div>
    </div>
  `
})
export class PerfilFotoComponent {
  private authService = inject(AuthService);
  private storage = inject(Storage);

  user = input<User | null>(null);

  successMessage = output<string>();
  errorMessage = output<string>();

  isUploading = signal(false);

  async uploadProfileImage(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.emit('');
    this.successMessage.emit('');

    try {
      const currentUser = this.user();
      if (!currentUser?.uid) throw new Error('Usuário não encontrado');

      const filePath = `profile_images/${currentUser.uid}_${Date.now()}`;
      const storageRef = ref(this.storage, filePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await this.authService.updateCurrentUserProfile({ photoURL: downloadURL });
      this.successMessage.emit('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      this.errorMessage.emit('Erro ao fazer upload da imagem.');
    } finally {
      this.isUploading.set(false);
      event.target.value = '';
    }
  }
}
