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
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
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

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Verifica a preferência do sistema. Mas o padrão será claro.
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
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
