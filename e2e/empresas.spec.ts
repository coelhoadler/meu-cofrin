import { test, expect } from '@playwright/test';

test.describe('Área Meu Cofrin Empresas', () => {
  test('deve carregar a tela de login corporativo com identidade visual correta', async ({ page }) => {
    await page.goto('http://localhost:4200/empresas/login');

    await expect(page).toHaveTitle(/Meu Cofrin Empresas - Login/i);
    await expect(page.getByRole('heading', { name: /Meu Cofrin Empresas/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Não tem conta\? Cadastre-se/i })).toBeVisible();
  });

  test('deve carregar a tela de cadastro corporativo com máscara de CNPJ', async ({ page }) => {
    await page.goto('http://localhost:4200/empresas/cadastro');

    await expect(page).toHaveTitle(/Meu Cofrin Empresas - Cadastro/i);
    await expect(page.getByRole('heading', { name: /Meu Cofrin Empresas/i })).toBeVisible();
    await expect(page.locator('#nomeFantasia')).toBeVisible();
    await expect(page.locator('#cnpj')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Testa aplicação da máscara de CNPJ
    await page.locator('#cnpj').fill('11222333000181');
    await expect(page.locator('#cnpj')).toHaveValue('11.222.333/0001-81');
  });

  test('deve exibir mensagem de erro ao inserir CNPJ com dígitos inválidos', async ({ page }) => {
    await page.goto('http://localhost:4200/empresas/cadastro');

    await page.locator('#nomeFantasia').fill('Empresa Teste LTDA');
    await page.locator('#cnpj').fill('00000000000000');
    await page.locator('#email').fill('empresa@teste.com');
    await page.locator('#password').fill('123456');

    // Clica fora para disparar touched/blur
    await page.locator('#nomeFantasia').click();

    await expect(page.getByText('Insira um CNPJ válido com dígitos verificadores corretos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar conta' })).toBeDisabled();
  });

  test('deve redirecionar para /empresas/login ao tentar acessar o dashboard sem autenticação', async ({ page }) => {
    await page.goto('http://localhost:4200/empresas/dashboard');

    await expect(page).toHaveURL(/.*\/empresas\/login.*/);
  });

  test('deve conter link de acesso ao Meu Cofrin Empresas na tela de login pessoal', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    const empresasLink = page.getByRole('link', { name: /Acessar Meu Cofrin Empresas/i });
    await expect(empresasLink).toBeVisible();
    await empresasLink.click();
    await expect(page).toHaveURL(/.*\/empresas\/login.*/);
  });
});
