import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('When in Browser environment', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      matchMediaMock = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });
    });

    it('should initialize with light theme if no localStorage and system prefers light', () => {
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('light');
    });

    it('should initialize with dark theme if no localStorage and system prefers dark', () => {
      matchMediaMock.mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
      }));
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('dark');
    });

    it('should initialize with saved theme from localStorage (dark)', () => {
      localStorage.setItem('theme', 'dark');
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('dark');
    });

    it('should toggle theme between light and dark', () => {
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);

      expect(service.currentTheme()).toBe('light');

      service.toggleTheme();
      TestBed.flushEffects();

      expect(service.currentTheme()).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      service.toggleTheme();
      TestBed.flushEffects();

      expect(service.currentTheme()).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should set theme to dark', () => {
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);

      service.setDark();
      TestBed.flushEffects();

      expect(service.currentTheme()).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should set theme to light', () => {
      localStorage.setItem('theme', 'dark');
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ThemeService);

      // Let effects run for initial initialization
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      service.setLight();
      TestBed.flushEffects();

      expect(service.currentTheme()).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('When in Non-Browser environment', () => {
    it('should default to light theme and not modify DOM/localStorage', () => {
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(ThemeService);

      expect(service.currentTheme()).toBe('light');

      service.setDark();
      TestBed.flushEffects();

      expect(service.currentTheme()).toBe('dark');
      expect(localStorage.getItem('theme')).toBeNull();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
