import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PrivacyConsentData {
  accepted: boolean;
  version: string;
  acceptedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivacyConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  public static readonly STORAGE_KEY = 'meu_cofrin_privacy_consent_v1';
  public static readonly CURRENT_VERSION = '1.0';

  /**
   * Armazena se o usuário já aceitou o aviso de privacidade e segurança.
   */
  readonly hasAccepted = signal<boolean>(this.getInitialConsent());

  /**
   * Indica se o banner deve ser exibido na tela.
   * Não é renderizado no SSR para prevenir flash de conteúdo e desajuste de hidratação.
   */
  readonly shouldShowBanner = computed<boolean>(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return !this.hasAccepted();
  });

  private getInitialConsent(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    try {
      const stored = localStorage.getItem(PrivacyConsentService.STORAGE_KEY);
      if (!stored) {
        return false;
      }
      const data: PrivacyConsentData = JSON.parse(stored);
      return data?.accepted === true && data?.version === PrivacyConsentService.CURRENT_VERSION;
    } catch {
      return false;
    }
  }

  /**
   * Registra o consentimento do usuário no signal e persiste no localStorage com versionamento e timestamp.
   */
  acceptConsent(): void {
    this.hasAccepted.set(true);

    if (isPlatformBrowser(this.platformId)) {
      try {
        const consentData: PrivacyConsentData = {
          accepted: true,
          version: PrivacyConsentService.CURRENT_VERSION,
          acceptedAt: new Date().toISOString()
        };
        localStorage.setItem(PrivacyConsentService.STORAGE_KEY, JSON.stringify(consentData));
      } catch (err) {
        console.warn('Não foi possível salvar o consentimento no localStorage:', err);
      }
    }
  }
}
