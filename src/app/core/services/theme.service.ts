import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  // O tema atual é armazenado num signal para os componentes reagirem se necessário.
  // Inicializa diretamente com o valor do localStorage para evitar que o effect
  // sobrescreva o tema salvo com o valor padrão 'light' durante a hydration.
  public currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect para atualizar o localStorage e o DOM sempre que o signal mudar
    effect(() => {
      const theme = this.currentTheme();
      if (isPlatformBrowser(this.platformId)) {
        try {
          localStorage.setItem('theme', theme);
          
          if (typeof document !== 'undefined' && document.documentElement) {
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        } catch {
          // Ignora caso localStorage ou DOM não estejam disponíveis
        }
      }
    });
  }

  /**
   * Lê o tema salvo no localStorage de forma síncrona para usar
   * como valor inicial do signal, antes de qualquer effect rodar.
   */
  private getInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      // Verifica a preferência do sistema. Mas o padrão será claro.
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
    } catch {
      return 'light';
    }

    return 'light';
  }

  public toggleTheme() {
    this.currentTheme.update(theme => theme === 'light' ? 'dark' : 'light');
  }

  public setDark() {
    this.currentTheme.set('dark');
  }

  public setLight() {
    this.currentTheme.set('light');
  }
}
