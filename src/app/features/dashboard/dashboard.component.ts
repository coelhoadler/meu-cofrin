import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private authService = inject(AuthService);

  isSidebarOpen = signal(false);
  user = this.authService.currentUser;
  currentDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
  }
}
