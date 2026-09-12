import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Guarda de rota corporativa para a área de Empresas (/empresas/*).
 * Garante que apenas usuários autenticados com cadastro válido corporativo acessem a área interna.
 */
export const empresaGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    switchMap(async (user) => {
      if (!user) {
        return router.createUrlTree(['/empresas/login'], { queryParams: { returnUrl: state.url } });
      }

      try {
        const isExpired = await authService.isSessionExpired(user);
        if (isExpired) {
          await authService.logout();
          return router.createUrlTree(['/empresas/login'], { queryParams: { returnUrl: state.url } });
        }

        const isEmpresa = await authService.isEmpresaAccount(user.uid);
        if (isEmpresa) {
          return true;
        }

        // Usuário autenticado sem perfil corporativo (conta pessoal)
        await authService.logout();
        return router.createUrlTree(['/empresas/login'], {
          queryParams: { error: 'acesso_exclusivo' },
        });
      } catch (error) {
        console.error('Erro ao verificar permissão corporativa no Firestore:', error);
        return router.createUrlTree(['/empresas/login'], {
          queryParams: { error: 'erro_verificacao' },
        });
      }
    })
  );
};
