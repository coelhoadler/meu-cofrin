import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    switchMap(async (user) => {
      if (user) {
        const isExpired = await authService.isSessionExpired(user);
        if (isExpired) {
          sessionService.handleSessionExpired('/login');
          return true;
        }

        // Impede que contas corporativas acessem as rotas de finanças pessoais
        const isEmpresa = await authService.isEmpresaAccount(user.uid);
        if (isEmpresa) {
          return router.createUrlTree(['/empresas/dashboard']);
        }

        return true;
      }
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};
