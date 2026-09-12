import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SessionExpiredModalComponent } from './session-expired-modal.component';
import { SessionService } from '../../auth/session.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SessionExpiredModalComponent', () => {
  let component: SessionExpiredModalComponent;
  let fixture: ComponentFixture<SessionExpiredModalComponent>;
  let sessionServiceMock: any;

  beforeEach(async () => {
    sessionServiceMock = {
      showExpiredModal: signal(false),
      confirmExpiredLogout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SessionExpiredModalComponent],
      providers: [{ provide: SessionService, useValue: sessionServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiredModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não deve exibir o modal quando showExpiredModal for falso', () => {
    const modalEl = fixture.nativeElement.querySelector('.fixed');
    expect(modalEl).toBeNull();
  });

  it('deve exibir o modal com título e texto explicativo quando showExpiredModal for verdadeiro', () => {
    sessionServiceMock.showExpiredModal.set(true);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('h2');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain('Sua sessão expirou');

    const buttonEl = fixture.nativeElement.querySelector('button');
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.textContent).toContain('Fazer novo login');
  });

  it('deve chamar confirmExpiredLogout ao clicar no botão de novo login', () => {
    sessionServiceMock.showExpiredModal.set(true);
    fixture.detectChanges();

    const buttonEl = fixture.nativeElement.querySelector('button');
    buttonEl.click();

    expect(sessionServiceMock.confirmExpiredLogout).toHaveBeenCalled();
  });
});
