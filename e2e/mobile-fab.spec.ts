import { test, expect } from '@playwright/test';

test.describe('Botão Flutuante Mobile de Retorno ao Dashboard', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('não deve exibir botão flutuante de voltar ao dashboard na tela de dashboard', async ({ page }) => {
    await page.goto('http://localhost:4200/dashboard');

    // Usuário não autenticado vai para /login
    await expect(page).toHaveURL(/.*\/login.*/);
    const fabBackButton = page.locator('#mobile-fab-back-dashboard');
    await expect(fabBackButton).not.toBeVisible();

    const fabNovaConta = page.locator('#tour-fab-nova-conta');
    await expect(fabNovaConta).not.toBeVisible();
  });
});
