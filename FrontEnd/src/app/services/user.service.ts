import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios (el interceptor agregará el token)
  obtenerUsuarios(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/usuarios`);
  }

  // Obtener usuario por ID (el interceptor agregará el token)
  obtenerUsuarioPorId(idUsuario: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/usuarios/${idUsuario}`);
  }
}

