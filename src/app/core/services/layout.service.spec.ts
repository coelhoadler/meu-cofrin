import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutService);
  });

  it('deve inicializar com a sidebar fechada', () => {
    expect(service.isSidebarOpen()).toBe(false);
  });

  it('deve abrir a sidebar com openSidebar()', () => {
    service.openSidebar();
    expect(service.isSidebarOpen()).toBe(true);
  });

  it('deve fechar a sidebar com closeSidebar()', () => {
    service.openSidebar();
    expect(service.isSidebarOpen()).toBe(true);

    service.closeSidebar();
    expect(service.isSidebarOpen()).toBe(false);
  });

  it('deve alternar a sidebar com toggleSidebar()', () => {
    expect(service.isSidebarOpen()).toBe(false);

    service.toggleSidebar();
    expect(service.isSidebarOpen()).toBe(true);

    service.toggleSidebar();
    expect(service.isSidebarOpen()).toBe(false);
  });
});
