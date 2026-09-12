import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';

import { empresaGuard } from './core/auth/empresa.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Meu Cofrin - Entrar no Controle Financeiro' },
  {
    path: 'verificar-email',
    loadComponent: () => import('./features/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent),
    title: 'Meu Cofrin - Verificar E-mail'
  },
  {
    path: 'verify-email',
    redirectTo: 'verificar-email'
  },
  {
    path: 'unsubscribe',
    loadComponent: () => import('./features/unsubscribe/unsubscribe.component').then(m => m.UnsubscribeComponent),
    title: 'Meu Cofrin | Cancelar Notificações'
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'Meu Cofrin | Dashboard' },
      {
        path: 'lancamentos',
        loadComponent: () => import('./features/lancamentos/lancamentos.component').then(m => m.LancamentosComponent),
        title: 'Meu Cofrin | Lançamentos'
      },
      {
        path: 'nova-conta',
        loadComponent: () => import('./features/nova-conta/nova-conta.component').then(m => m.NovaContaComponent),
        title: 'Meu Cofrin | Nova Conta'
      },
      {
        path: 'editar-conta/:id',
        loadComponent: () => import('./features/nova-conta/nova-conta.component').then(m => m.NovaContaComponent),
        title: 'Meu Cofrin | Editar Conta'
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categorias/categorias.component').then(m => m.CategoriasComponent),
        title: 'Meu Cofrin | Categorias'
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then(m => m.Perfil),
        title: 'Meu Cofrin | Meu Perfil'
      },
      {
        path: 'conta/:id',
        loadComponent: () => import('./features/pagar-conta/pagar-conta.component').then(m => m.PagarContaComponent),
        title: 'Meu Cofrin | Atualizar Conta'
      },
      {
        path: 'investimentos',
        loadComponent: () => import('./features/investimentos/investimentos.component').then(m => m.InvestimentosComponent),
        title: 'Meu Cofrin | Investimentos'
      },
      {
        path: 'investimentos/:id/evolucao',
        loadComponent: () => import('./features/investimentos/evolucao/evolucao.component').then(m => m.EvolucaoComponent),
        title: 'Meu Cofrin | Evolução do Investimento'
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'empresas',
    loadComponent: () => import('./features/empresas/layout/empresas-layout.component').then(m => m.EmpresasLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/empresas/login/empresas-login.component').then(m => m.EmpresasLoginComponent),
        title: 'Meu Cofrin Empresas - Login'
      },
      {
        path: 'cadastro',
        loadComponent: () => import('./features/empresas/cadastro/empresas-cadastro.component').then(m => m.EmpresasCadastroComponent),
        title: 'Meu Cofrin Empresas - Cadastro'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/empresas/layout/empresas-main-layout.component').then(m => m.EmpresasMainLayoutComponent),
        canActivate: [empresaGuard],
        children: [
          { path: '', component: DashboardComponent, title: 'Meu Cofrin Empresas | Dashboard' }
        ]
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
