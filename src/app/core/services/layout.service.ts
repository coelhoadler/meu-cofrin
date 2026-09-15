import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  /**
   * Indica se a barra lateral mobile está aberta.
   */
  readonly isSidebarOpen = signal(false);

  /**
   * Indica se o conteúdo principal atingiu o final da rolagem.
   */
  readonly isAtBottom = signal(false);

  /**
   * Alterna o estado de abertura da barra lateral.
   */
  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }

  /**
   * Abre a barra lateral mobile.
   */
  openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  /**
   * Fecha a barra lateral mobile.
   */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
