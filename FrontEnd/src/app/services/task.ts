import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interface/user.interface';
import { Task } from '../interface/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // --- TAREAS ---
  // El interceptor agregará el token automáticamente
  obtenerTareas(token: string = ''): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/tasks`);
  }

  obtenerTareaPorId(id: number, token: string = ''): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/tasks/${id}`);
  }

  agregarTarea(tarea: Partial<Task>, token: string = ''): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks/agregar`, tarea);
  }

  actualizarTarea(id: number, tarea: Partial<Task>, token: string = ''): Observable<any> {
    return this.http.put(`${this.baseUrl}/tasks/actualizar/${id}`, tarea);
  }

  actualizarEstadoTarea(id: number, estado: string, token: string = ''): Observable<any> {
    return this.http.patch(`${this.baseUrl}/tasks/estado/${id}`, { estado });
  }

  eliminarTarea(id: number, token: string = ''): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tasks/eliminar/${id}`);
  }

  // --- USUARIOS (opcional) ---
  obtenerUsuarios(token: string = ''): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/usuarios`);
  }

  obtenerUsuarioPorId(id: number, token: string = ''): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/usuarios/${id}`);
  }
}
