import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');

  // No agregar token si:
  // 1. No hay token en localStorage
  // 2. La petición ya tiene un header Authorization (ej: verifyCode con token temporal)
  // 3. Es una ruta pública (login, register)
  const hasAuthHeader = req.headers.has('Authorization');
  const isPublicRoute = req.url.includes('/login') || req.url.includes('/register');

  // Si hay token, no hay header Authorization previo, y no es ruta pública, agregarlo
  if (token && !hasAuthHeader && !isPublicRoute) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // Para otros casos, continuar sin modificar
  return next(req);
};
