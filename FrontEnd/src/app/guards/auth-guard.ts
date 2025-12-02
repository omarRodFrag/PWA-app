import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el token está expirado (decodificación básica)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milisegundos
    if (Date.now() >= exp) {
      localStorage.removeItem('auth_token');
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    // Si hay error al decodificar, asumir token inválido
    localStorage.removeItem('auth_token');
    router.navigate(['/login']);
    return false;
  }

  return true;
};
