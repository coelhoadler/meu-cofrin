import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { UserSessionComponent } from './user-session.component';
import { AuthService } from '../../auth/auth.service';
import { SessionService } from '../../auth/session.service';

describe('UserSessionComponent', () => {
  let component: UserSessionComponent;
  let fixture: ComponentFixture<UserSessionComponent>;
  let authServiceMock: any;
  let sessionServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal({
        displayName: 'Adler Coelho',
        email: 'adler@email.com',
        photoURL: null,
      }),
    };

    sessionServiceMock = {
      remainingFormatted: signal('45m restantes'),
      progressPercentage: signal(75),
      urgencyLevel: signal<'normal' | 'warning' | 'danger'>('normal'),
    };

    await TestBed.configureTestingModule({
      imports: [UserSessionComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser instanciado com sucesso', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir o nome do usuário e tempo restante de sessão na sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Adler Coelho');
    expect(compiled.textContent).toContain('45m restantes');
  });

  it('deve exibir a inicial do nome quando não houver foto', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeNull();
    expect(compiled.textContent).toContain('A');
  });

  it('deve renderizar a foto de perfil quando fornecida', () => {
    authServiceMock.currentUser.set({
      displayName: 'Adler Coelho',
      email: 'adler@email.com',
      photoURL: 'https://exemplo.com/foto.jpg',
    });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://exemplo.com/foto.jpg');
  });

  it('deve aplicar as classes de urgência corretas para status danger', () => {
    sessionServiceMock.urgencyLevel.set('danger');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.text-rose-400, .text-rose-500');
    const bar = compiled.querySelector('.bg-rose-500');
    expect(badge).not.toBeNull();
    expect(bar).not.toBeNull();
  });

  it('deve renderizar o modo header com saudação e tempo de sessão', () => {
    fixture.componentRef.setInput('variant', 'header');
    fixture.componentRef.setInput('greeting', 'Bom dia, Adler!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bom dia, Adler!');
    expect(compiled.textContent).toContain('45m restantes');
  });
});
