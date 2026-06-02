import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);

  isSidebarOpen = signal(false);
  user = this.authService.currentUser;

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
  }
}
