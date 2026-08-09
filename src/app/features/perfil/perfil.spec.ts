import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Storage } from '@angular/fire/storage';
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
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Storage, useValue: mockStorage },
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
