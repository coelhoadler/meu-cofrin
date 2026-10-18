import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyBannerComponent } from './privacy-banner.component';
import { PrivacyConsentService } from '../../services/privacy-consent.service';
import { PLATFORM_ID, signal } from '@angular/core';

describe('PrivacyBannerComponent', () => {
  let component: PrivacyBannerComponent;
  let fixture: ComponentFixture<PrivacyBannerComponent>;
  let mockConsentService: {
    shouldShowBanner: ReturnType<typeof signal<boolean>>;
    acceptConsent: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockConsentService = {
      shouldShowBanner: signal(true),
      acceptConsent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PrivacyBannerComponent],
      providers: [
        { provide: PrivacyConsentService, useValue: mockConsentService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser instanciado com sucesso', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir o banner quando shouldShowBanner for true', () => {
    const bannerElement = fixture.nativeElement.querySelector('aside');
    expect(bannerElement).toBeTruthy();
    expect(bannerElement.textContent).toContain('Privacidade e Segurança');
    expect(bannerElement.textContent).toContain('Prosseguir');
  });

  it('deve chamar acceptConsent ao clicar no botão Prosseguir', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();

    button.click();

    expect(mockConsentService.acceptConsent).toHaveBeenCalledTimes(1);
  });

  it('não deve exibir o banner quando shouldShowBanner for false', () => {
    mockConsentService.shouldShowBanner.set(false);
    fixture.detectChanges();

    const bannerElement = fixture.nativeElement.querySelector('aside');
    expect(bannerElement).toBeNull();
  });
});
