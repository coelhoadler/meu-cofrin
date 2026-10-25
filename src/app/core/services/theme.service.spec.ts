import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('deve inicializar com "light" como padrão quando matchMedia não existir e localStorage estiver vazio', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    expect(service.currentTheme()).toBe('light');
  });

  it('deve respeitar o tema salvo no localStorage', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    expect(service.currentTheme()).toBe('dark');
  });

  it('deve respeitar a preferência de sistema dark quando matchMedia estiver disponível e não houver tema salvo', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const service = TestBed.runInInjectionContext(() => new ThemeService());
    expect(service.currentTheme()).toBe('dark');

    // @ts-expect-error reset matchMedia
    delete window.matchMedia;
  });

  it('deve alternar o tema com toggleTheme()', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    expect(service.currentTheme()).toBe('light');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
  });

  it('deve definir explicitamente com setDark() e setLight()', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());

    service.setDark();
    expect(service.currentTheme()).toBe('dark');

    service.setLight();
    expect(service.currentTheme()).toBe('light');
  });

  it('deve retornar "light" no ambiente servidor (SSR)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe('light');
  });
});
