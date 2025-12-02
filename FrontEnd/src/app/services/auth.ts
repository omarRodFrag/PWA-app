import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Login } from '../interface/login.interface';
import { User } from '../interface/user.interface';

interface LoginResponse {
  message: string;
  token: string; // token temporal
}

interface VerifyCodeResponse {
  message: string;
  token?: string; // si envías token final
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:5000';
  private currentUser: User | null = null;

  constructor(private http: HttpClient) {}

  // --- Headers con token ---
  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- Login con JWT ---
  login(data: Login): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data);
  }

  // --- Registro público ---
  register(data: { strNombre: string; strEmail: string; strPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, data);
  }

  // --- Verificar código ---
  verifyCode(body: { code: string }, token: string): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(
      `${this.baseUrl}/verify`,
      body,
      { headers: this.getAuthHeaders(token) }
    ).pipe(
      tap(() => {
        // Después de verificar, obtener y guardar información del usuario
        this.loadCurrentUser();
      })
    );
  }

  // --- Obtener usuario actual ---
  loadCurrentUser(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const idUsuario = tokenPayload.idUsuario;
      
      // Obtener usuario del backend para tener el rol actualizado
      this.http.get<User>(`${this.baseUrl}/usuarios/${idUsuario}`).subscribe({
        next: (user) => {
          this.currentUser = user;
          if (user.rol) {
            localStorage.setItem('user_role', user.rol);
          }
        },
        error: (err) => {
          console.error('Error al obtener usuario:', err);
        }
      });
    } catch (e) {
      console.error('Error al decodificar token:', e);
    }
  }

  // --- Obtener rol del usuario actual ---
  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  // --- Verificar si es administrador ---
  isAdmin(): boolean {
    return this.getUserRole() === 'administrador';
  }

  // --- Obtener usuario actual ---
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // --- Limpiar datos de sesión ---
  clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    this.currentUser = null;
  }
}
