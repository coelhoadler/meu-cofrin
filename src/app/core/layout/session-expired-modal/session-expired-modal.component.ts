import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../auth/session.service';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-expired-modal.component.html',
})
export class SessionExpiredModalComponent {
  public sessionService = inject(SessionService);

  onConfirmLogin(): void {
    this.sessionService.confirmExpiredLogout();
  }
}
