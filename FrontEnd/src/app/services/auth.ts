import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Login } from '../interface/login.interface';

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

  constructor(private http: HttpClient) {}

  // --- Headers con token ---
  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- Login con JWT ---
  login(data: Login): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data);
  }

  // --- Verificar código ---
  verifyCode(body: { code: string }, token: string): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(
      `${this.baseUrl}/verify`,
      body,
      { headers: this.getAuthHeaders(token) }
    );
  }
}
