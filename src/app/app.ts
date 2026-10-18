import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionExpiredModalComponent } from './core/layout/session-expired-modal/session-expired-modal.component';
import { PrivacyBannerComponent } from './core/layout/privacy-banner/privacy-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SessionExpiredModalComponent, PrivacyBannerComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('meu-cofrin');
}
