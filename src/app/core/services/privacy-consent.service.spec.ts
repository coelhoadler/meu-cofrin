import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { PrivacyConsentService } from './privacy-consent.service';

describe('PrivacyConsentService', () => {
  let service: PrivacyConsentService;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('no ambiente do navegador', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          PrivacyConsentService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      service = TestBed.inject(PrivacyConsentService);
    });

    it('deve inicializar com consentimento pendente se localStorage estiver vazio', () => {
      expect(service.hasAccepted()).toBe(false);
      expect(service.shouldShowBanner()).toBe(true);
    });

    it('deve registrar o consentimento e persistir no localStorage', () => {
      service.acceptConsent();

      expect(service.hasAccepted()).toBe(true);
      expect(service.shouldShowBanner()).toBe(false);

      const saved = localStorage.getItem(PrivacyConsentService.STORAGE_KEY);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.accepted).toBe(true);
      expect(parsed.version).toBe(PrivacyConsentService.CURRENT_VERSION);
      expect(parsed.acceptedAt).toBeDefined();
    });

    it('deve inicializar como aceito se já houver registro válido na mesma versão', () => {
      localStorage.setItem(
        PrivacyConsentService.STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          version: PrivacyConsentService.CURRENT_VERSION,
          acceptedAt: new Date().toISOString()
        })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PrivacyConsentService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      const restoredService = TestBed.inject(PrivacyConsentService);

      expect(restoredService.hasAccepted()).toBe(true);
      expect(restoredService.shouldShowBanner()).toBe(false);
    });

    it('deve solicitar novo consentimento caso a versão salva seja diferente', () => {
      localStorage.setItem(
        PrivacyConsentService.STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          version: '0.9',
          acceptedAt: new Date().toISOString()
        })
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PrivacyConsentService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      const updatedService = TestBed.inject(PrivacyConsentService);

      expect(updatedService.hasAccepted()).toBe(false);
      expect(updatedService.shouldShowBanner()).toBe(true);
    });
  });

  describe('no ambiente do servidor (SSR)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          PrivacyConsentService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      service = TestBed.inject(PrivacyConsentService);
    });

    it('não deve exibir o banner durante SSR para evitar mismatch na hidratação', () => {
      expect(service.shouldShowBanner()).toBe(false);
    });
  });
});
