import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../auth/auth.service';
import { SessionService } from '../../auth/session.service';

@Component({
  selector: 'app-user-session, app-user-session-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mt-auto' },
  templateUrl: './user-session.component.html'
})
export class UserSessionComponent {
  public sessionService = inject(SessionService);
  private authService = inject(AuthService);

  isDesktopSidebarCollapsed = input<boolean>(false);
  customUser = input<User | null | undefined>(undefined, { alias: 'user' });

  user = computed(() => {
    const passedUser = this.customUser();
    return passedUser !== undefined ? passedUser : this.authService.currentUser();
  });
}
