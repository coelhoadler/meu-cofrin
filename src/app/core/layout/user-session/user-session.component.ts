import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../auth/auth.service';
import { SessionService } from '../../auth/session.service';

export type UserSessionVariant = 'sidebar' | 'header';

@Component({
  selector: 'app-user-session, app-user-session-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './user-session.component.html'
})
export class UserSessionComponent {
  public sessionService = inject(SessionService);
  private authService = inject(AuthService);

  variant = input<UserSessionVariant>('sidebar');
  greeting = input<string>('');
  isDesktopSidebarCollapsed = input<boolean>(false);
  customUser = input<User | null | undefined>(undefined, { alias: 'user' });

  user = computed(() => {
    const passedUser = this.customUser();
    return passedUser !== undefined ? passedUser : this.authService.currentUser();
  });

  computedGreeting = computed(() => {
    const explicitGreeting = this.greeting();
    if (explicitGreeting) return explicitGreeting;

    const data = new Date();
    const hora = data.getHours();
    const userName = this.user()?.displayName?.split(' ')[0] || '';
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    return userName ? `${saudacao}, ${userName}!` : `${saudacao}!`;
  });
}
