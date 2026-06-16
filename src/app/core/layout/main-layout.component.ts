import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ContaService } from '../services/conta.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private contaService = inject(ContaService);
  public themeService = inject(ThemeService);

  isSidebarOpen = signal(false);
  user = this.authService.currentUser;

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    this.contaService.invalidateCache();
    await this.authService.logout();
  }
}
