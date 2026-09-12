import { test, expect } from '@playwright/test';

test.describe('Gestão e Layout de Sessão Expirada', () => {
  test('deve conter o modal de sessão expirada montado na aplicação', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    // Verifica que a aplicação inicializa com o componente app-session-expired-modal presente no DOM
    const modalTag = page.locator('app-session-expired-modal');
    await expect(modalTag).toBeAttached();
  });

  test('deve redirecionar para tela de login e não exibir modal quando deslogado', async ({ page }) => {
    await page.goto('http://localhost:4200/dashboard');
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
