import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const stored = localStorage.getItem('auth_user');
    const user = stored ? JSON.parse(stored) : null;
    if (user?.token) {
      return next(req.clone({
        headers: req.headers.set('Authorization', `Bearer ${user.token}`)
      }));
    }
  } catch { /* ignore parse errors */ }
  return next(req);
};
