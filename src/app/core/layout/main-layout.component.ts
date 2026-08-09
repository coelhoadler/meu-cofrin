import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ContaService } from '../services/conta.service';
import { ThemeService } from '../services/theme.service';
import { TourService } from '../services/tour.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  public themeService = inject(ThemeService);
  public router = inject(Router);
  private authService = inject(AuthService);
  private contaService = inject(ContaService);
  private tourService = inject(TourService);

  isSidebarOpen = signal(false);
  isDesktopSidebarCollapsed = signal(false);
  isQrCodeModalOpen = signal(false);
  isContactModalOpen = signal(false);
  user = this.authService.currentUser;

  private touchStartX = 0;
  private touchEndX = 0;

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  toggleDesktopSidebar() {
    this.isDesktopSidebarCollapsed.update((v) => !v);
  }

  openQrCodeModal() {
    this.isQrCodeModalOpen.set(true);
  }

  closeQrCodeModal() {
    this.isQrCodeModalOpen.set(false);
  }

  openContactModal() {
    this.isContactModalOpen.set(true);
  }

  closeContactModal() {
    this.isContactModalOpen.set(false);
  }

  startTour() {
    this.tourService.startDashboardTour(true);
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

    // Swipe da esquerda para a direita (abrir menu)
    // O swipe deve começar próximo à borda esquerda (menos de 60px) para evitar toques acidentais
    if (swipeDistance > 50 && this.touchStartX < 60 && !this.isSidebarOpen()) {
      this.isSidebarOpen.set(true);
    }

    // Swipe da direita para a esquerda (fechar menu)
    if (swipeDistance < -50 && this.isSidebarOpen()) {
      this.isSidebarOpen.set(false);
    }
  }

  async logout() {
    this.contaService.invalidateCache();
    await this.authService.logout();
  }
}
