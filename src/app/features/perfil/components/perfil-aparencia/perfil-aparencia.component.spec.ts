import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PerfilAparenciaComponent } from './perfil-aparencia.component';
import { ThemeService, Theme } from '../../../../core/services/theme.service';
import { describe, it, expect, beforeEach, vi } from "vitest";

describe('PerfilAparenciaComponent', () => {
  let component: PerfilAparenciaComponent;
  let fixture: ComponentFixture<PerfilAparenciaComponent>;
  let themeServiceMock: any;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

    themeServiceMock = {
      currentTheme: signal<Theme>('light'),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PerfilAparenciaComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilAparenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve instanciar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve refletir o tema atual a partir do ThemeService', () => {
    expect(component.isDark()).toBe(false);

    themeServiceMock.currentTheme.set('dark');
    fixture.detectChanges();
    expect(component.isDark()).toBe(true);
  });

  it('deve alternar o tema ao clicar no botão', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(themeServiceMock.toggleTheme).toHaveBeenCalled();
  });
});
