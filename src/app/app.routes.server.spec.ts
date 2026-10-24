import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { describe, it, expect } from 'vitest';

describe('Server Routes', () => {
  it('should configure login route with Prerender mode', () => {
    const route = serverRoutes.find(r => r.path === 'login');
    expect(route).toBeDefined();
    expect(route?.renderMode).toBe(RenderMode.Prerender);
  });

  it('should configure verificar-email route with Prerender mode', () => {
    const route = serverRoutes.find(r => r.path === 'verificar-email');
    expect(route).toBeDefined();
    expect(route?.renderMode).toBe(RenderMode.Prerender);
  });

  it('should configure unsubscribe route with Prerender mode', () => {
    const route = serverRoutes.find(r => r.path === 'unsubscribe');
    expect(route).toBeDefined();
    expect(route?.renderMode).toBe(RenderMode.Prerender);
  });

  it('should configure fallback route (**) with Client mode', () => {
    const route = serverRoutes.find(r => r.path === '**');
    expect(route).toBeDefined();
    expect(route?.renderMode).toBe(RenderMode.Client);
  });

  it('should have exactly 4 routes configured', () => {
    expect(serverRoutes.length).toBe(4);
  });
});
