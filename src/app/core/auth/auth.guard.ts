import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    switchMap(async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult() || { claims: { auth_time: 0 } };
        // auth_time vem em segundos, convertemos para milissegundos
        const authTime = Number(idTokenResult.claims['auth_time']) * 1000;
        const now = Date.now();
        const maxDuration = 120 * 60 * 1000; // 2 horas em milissegundos

        if (now - authTime > maxDuration) {
          await auth.signOut(); // Força o logout se expirou
          return router.createUrlTree(['/login']);
        }
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
