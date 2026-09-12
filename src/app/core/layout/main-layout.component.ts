import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
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
export class MainLayoutComponent implements OnDestroy {
  public themeService = inject(ThemeService);
  public router = inject(Router);
  public sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private contaService = inject(ContaService);
  private tourService = inject(TourService);

  @ViewChild('mainContent') mainContent?: ElementRef<HTMLElement>;

  isSidebarOpen = signal(false);
  isDesktopSidebarCollapsed = signal(false);
  isQrCodeModalOpen = signal(false);
  isContactModalOpen = signal(false);
  isAtBottom = signal(false);
  currentUrl = signal(this.router.url);

  user = this.authService.currentUser;

  readonly isBackButtonVisible = computed(() => {
    if (this.isSidebarOpen()) return false;
    if (this.isAtBottom()) return false;
    const url = (this.currentUrl() || '').split('?')[0];
    if (url === '/dashboard' || url === '' || url === '/') return false;
    return true;
  });

  private routerSub: Subscription;

  constructor() {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
        this.isAtBottom.set(false);
        if (this.mainContent?.nativeElement) {
          this.mainContent.nativeElement.scrollTop = 0;
        }
      });
  }

  ngOnDestroy() {
    this.routerSub.unsubscribe();
  }

  onContentScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (!target) return;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const hasScroll = scrollHeight > clientHeight + 40;
    const atBottom = hasScroll && (scrollHeight - scrollTop - clientHeight <= 40);
    this.isAtBottom.set(atBottom);
  }

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

  public greetingUser(): string {
    const data = new Date();
    const hora = data.getHours();
    const userName = this.authService.currentUser()?.displayName?.split(' ')[0] || '';

    if (hora < 12) {
      return `Bom dia, ${userName}!`;
    } else if (hora < 18) {
      return `Boa tarde, ${userName}!`;
    } else {
      return `Boa noite, ${userName}!`;
    }
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
