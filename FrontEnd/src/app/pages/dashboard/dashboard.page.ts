import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from 'src/app/services/task';
import { AuthService } from 'src/app/services/auth';
import { NotificationService, TaskNotification } from 'src/app/services/notification.service';
import { Task } from '../../interface/task.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {

  // Filtros UI
  estadoFiltro: string = 'all';
  prioridadFiltro: string = 'all';
  searchTerm: string = '';

  // Datos
  tasks: Task[] = [];
  allTasks: Task[] = []; // Todas las tareas (sin filtrar por rol)
  loading: boolean = true;
  isAdmin: boolean = false;
  currentUserId: number | null = null;
  notifications: TaskNotification[] = [];
  hasNotifications: boolean = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadTasks();
  }

  ionViewWillEnter() {
    this.checkUserRole();
    this.loadTasks();
  }

  checkUserRole() {
    this.isAdmin = this.authService.isAdmin();
    
    // Obtener ID del usuario actual
    const token = localStorage.getItem('auth_token') || '';
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = tokenPayload.idUsuario;
    } catch (e) {
      console.warn('No se pudo obtener idUsuario del token');
    }
  }

  loadTasks() {
    this.loading = true;
    // El interceptor agregará el token automáticamente
    this.taskService.obtenerTareas('').subscribe({
      next: (data) => {
        this.allTasks = data || [];
        this.applyRoleFilter();
        this.loading = false;
      },
      error: (err) => {
        // Si falla el backend: datos mock para demo (no romper la UI)
        console.warn('No se pudo obtener tareas (mock fallback).', err);
        this.allTasks = this.mockTasks();
        this.applyRoleFilter();
        this.loading = false;
      }
    });
  }

  applyRoleFilter() {
    if (this.isAdmin) {
      // Admin ve todas las tareas
      this.tasks = [...this.allTasks];
    } else {
      // Alumno solo ve sus tareas asignadas
      if (this.currentUserId) {
        this.tasks = this.allTasks.filter(task => 
          task.usuarioAsignado === this.currentUserId
        );
      } else {
        this.tasks = [];
      }
    }
    
    // Actualizar notificaciones después de filtrar
    this.updateNotifications();
  }

  updateNotifications() {
    this.notifications = this.notificationService.getUpcomingTasks(this.tasks);
    this.hasNotifications = this.notificationService.hasNotifications(this.tasks);
  }

  mockTasks(): Task[] {
    return [
      { idTarea: 1, titulo: 'Tarea', descripcion: '.', fechaEntrega: '2025-12-30', prioridad: 'low', estado: 'todo', usuarioAsignado: 1, creador: 2, fechaRegistro: new Date().toISOString(), ultimaActualizacion: new Date().toISOString() },
      { idTarea: 2, titulo: 'Entregar reporte PWA', descripcion: 'Resumen corto.', fechaEntrega: '2025-10-04', prioridad: 'high', estado: 'todo', usuarioAsignado: 1, creador: 2, fechaRegistro: new Date().toISOString(), ultimaActualizacion: new Date().toISOString() },
      { idTarea: 3, titulo: 'Configurar Service Worker', descripcion: 'Cache estático y API.', fechaEntrega: '2025-10-01', prioridad: 'med', estado: 'doing', usuarioAsignado: 1, creador: 2, fechaRegistro: new Date().toISOString(), ultimaActualizacion: new Date().toISOString() },
      { idTarea: 4, titulo: 'Diseño de UI', descripcion: 'Pantallas básicas.', fechaEntrega: '2025-09-30', prioridad: 'low', estado: 'done', usuarioAsignado: 1, creador: 2, fechaRegistro: new Date().toISOString(), ultimaActualizacion: new Date().toISOString() }
    ];
  }

  // Filtros e interacción
  aplicarFiltro(task: Task): boolean {
    if (this.estadoFiltro !== 'all' && task.estado !== this.estadoFiltro) return false;
    if (this.prioridadFiltro !== 'all' && task.prioridad !== this.prioridadFiltro) return false;
    if (this.searchTerm && !(`${task.titulo} ${task.descripcion}`.toLowerCase().includes(this.searchTerm.toLowerCase()))) return false;
    return true;
  }

  tareasFiltradas() {
    // Primero aplicar filtro de rol, luego filtros de UI
    return this.tasks.filter(t => this.aplicarFiltro(t));
  }

  abrirTarea(t: Task) {
    this.router.navigate(['/task-detail', t.idTarea]);
  }

  nuevaTarea() {
    this.router.navigate(['/task-form']);
  }

  toggleEstado(t: Task) {
    // UI inmediata (optimista)
    const nuevoEstado = t.estado === 'done' ? 'todo' : 'done';
    const prev = t.estado;
    t.estado = nuevoEstado;

    // El interceptor agregará el token automáticamente
    this.taskService.actualizarEstadoTarea(t.idTarea, nuevoEstado, '').subscribe({
      next: () => {/* OK */},
      error: () => { t.estado = prev; /* revertir si falla */ }
    });
  }
}
