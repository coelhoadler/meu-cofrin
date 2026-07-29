import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';

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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
