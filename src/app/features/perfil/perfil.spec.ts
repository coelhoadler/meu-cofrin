import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Storage } from '@angular/fire/storage';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { WebauthnService } from '../../core/auth/webauthn.service';
import { Perfil } from './perfil';
import { vi } from 'vitest';

describe('Perfil', () => {
  let component: Perfil;
  let fixture: ComponentFixture<Perfil>;

  const mockAuthService = {
    currentUser: signal(null),
    currentUserSignal: signal(null),
    updateUserProfile: vi.fn(),
    sendVerificationEmail: vi.fn(),
  };

  const mockStorage = {};
  const mockWebauthnService = {
    isAvailable: vi.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Storage, useValue: mockStorage },
        { provide: Firestore, useValue: {} },
        { provide: WebauthnService, useValue: mockWebauthnService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Perfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
