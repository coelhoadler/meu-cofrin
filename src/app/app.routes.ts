import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Meu Cofrin | Login' },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'Meu Cofrin | Dashboard' },
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
