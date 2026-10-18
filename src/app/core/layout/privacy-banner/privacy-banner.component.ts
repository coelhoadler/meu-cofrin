import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyConsentService } from '../../services/privacy-consent.service';

@Component({
  selector: 'app-privacy-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-banner.component.html',
})
export class PrivacyBannerComponent {
  public readonly consentService = inject(PrivacyConsentService);

  onProceed(): void {
    this.consentService.acceptConsent();
  }
}
