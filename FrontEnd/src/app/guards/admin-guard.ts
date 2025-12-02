import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el token está expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() >= exp) {
      localStorage.removeItem('auth_token');
      router.navigate(['/login']);
      return false;
    }

    // Obtener rol del usuario desde el token o localStorage
    // Nota: El rol debería estar en el token o necesitamos obtenerlo del backend
    // Por ahora, verificamos si hay un rol guardado en localStorage
    const userRole = localStorage.getItem('user_role');
    
    if (userRole !== 'administrador') {
      router.navigate(['/dashboard']);
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem('auth_token');
    router.navigate(['/login']);
    return false;
  }
};

