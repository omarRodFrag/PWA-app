import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/services/task';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth';
import { Task } from 'src/app/interface/task.interface';
import { User } from 'src/app/interface/user.interface';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit {
  tasks: Task[] = [];
  users: User[] = [];
  loading: boolean = true;
  
  // Estadísticas generales
  totalTareas: number = 0;
  tareasCompletadas: number = 0;
  tareasPendientes: number = 0;
  tareasEnProgreso: number = 0;
  
  // Estadísticas por prioridad
  tareasAlta: number = 0;
  tareasMedia: number = 0;
  tareasBaja: number = 0;
  
  // Estadísticas por usuario
  statsPorUsuario: Array<{
    usuario: User;
    total: number;
    completadas: number;
    pendientes: number;
    enProgreso: number;
  }> = [];
  
  usuarioFiltro: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    // Cargar tareas y usuarios en paralelo
    this.taskService.obtenerTareas('').subscribe({
      next: (tasks) => {
        this.tasks = tasks || [];
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar tareas:', err);
        this.loading = false;
      }
    });

    this.userService.obtenerUsuarios().subscribe({
      next: (users) => {
        this.users = users || [];
        this.calculateStats();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  calculateStats() {
    // Filtrar tareas según filtros
    let filteredTasks = [...this.tasks];
    
    if (this.usuarioFiltro) {
      filteredTasks = filteredTasks.filter(t => t.usuarioAsignado === this.usuarioFiltro);
    }
    
    if (this.fechaInicio) {
      filteredTasks = filteredTasks.filter(t => {
        if (!t.fechaEntrega) return false;
        return t.fechaEntrega >= this.fechaInicio;
      });
    }
    
    if (this.fechaFin) {
      filteredTasks = filteredTasks.filter(t => {
        if (!t.fechaEntrega) return false;
        return t.fechaEntrega <= this.fechaFin;
      });
    }

    // Estadísticas generales
    this.totalTareas = filteredTasks.length;
    this.tareasCompletadas = filteredTasks.filter(t => t.estado === 'done').length;
    this.tareasPendientes = filteredTasks.filter(t => t.estado === 'todo').length;
    this.tareasEnProgreso = filteredTasks.filter(t => t.estado === 'doing').length;

    // Estadísticas por prioridad
    this.tareasAlta = filteredTasks.filter(t => t.prioridad === 'high').length;
    this.tareasMedia = filteredTasks.filter(t => t.prioridad === 'med').length;
    this.tareasBaja = filteredTasks.filter(t => t.prioridad === 'low').length;

    // Estadísticas por usuario
    this.statsPorUsuario = this.users.map(user => {
      const userTasks = filteredTasks.filter(t => t.usuarioAsignado === user.idUsuario);
      return {
        usuario: user,
        total: userTasks.length,
        completadas: userTasks.filter(t => t.estado === 'done').length,
        pendientes: userTasks.filter(t => t.estado === 'todo').length,
        enProgreso: userTasks.filter(t => t.estado === 'doing').length
      };
    }).filter(stat => stat.total > 0); // Solo mostrar usuarios con tareas
  }

  aplicarFiltros() {
    this.calculateStats();
  }

  limpiarFiltros() {
    this.usuarioFiltro = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.calculateStats();
  }

  getPorcentajeCompletadas(): number {
    if (this.totalTareas === 0) return 0;
    return Math.round((this.tareasCompletadas / this.totalTareas) * 100);
  }

  getPorcentajePorUsuario(completadas: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completadas / total) * 100);
  }
}

