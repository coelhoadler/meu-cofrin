import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ThemeService } from '../../../core/services/theme.service';

export interface CompanyProfile {
  nomeFantasia: string;
  cnpj: string;
  email: string;
}

@Component({
  selector: 'app-empresas-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresas-main-layout.component.html',
})
export class EmpresasMainLayoutComponent implements OnInit {
  public themeService = inject(ThemeService);
  public router = inject(Router);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  isSidebarOpen = signal(false);
  isDesktopSidebarCollapsed = signal(false);
  companyProfile = signal<CompanyProfile | null>(null);
  user = this.authService.currentUser;

  private touchStartX = 0;
  private touchEndX = 0;

  async ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      await this.loadCompanyProfile(currentUser.uid);
    }
  }

  async loadCompanyProfile(uid: string) {
    try {
      const companyDoc = await getDoc(doc(this.firestore, `companies/${uid}`));
      if (companyDoc.exists()) {
        this.companyProfile.set(companyDoc.data() as CompanyProfile);
        return;
      }
    } catch (error) {
      // Ignora erro de leitura em companies
    }

    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile = data?.['companies'] || data?.['perfil'];
        if (profile) {
          this.companyProfile.set({
            nomeFantasia: profile.nomeFantasia || profile.displayName || 'Empresa',
            cnpj: profile.cnpj || '',
            email: profile.email || '',
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil corporativo em users:', err);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  toggleDesktopSidebar() {
    this.isDesktopSidebarCollapsed.update((v) => !v);
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (swipeDistance > 50 && this.touchStartX < 60 && !this.isSidebarOpen()) {
      this.isSidebarOpen.set(true);
    }
    if (swipeDistance < -50 && this.isSidebarOpen()) {
      this.isSidebarOpen.set(false);
    }
  }

  public greetingCompany(): string {
    const data = new Date();
    const hora = data.getHours();
    const name = this.companyProfile()?.nomeFantasia || this.user()?.displayName || 'Empresa';

    if (hora < 12) {
      return `Bom dia, ${name}!`;
    } else if (hora < 18) {
      return `Boa tarde, ${name}!`;
    } else {
      return `Boa noite, ${name}!`;
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/empresas/login']);
  }
}
