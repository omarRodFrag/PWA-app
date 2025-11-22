import { Component, OnInit } from '@angular/core';

interface Task {
  titulo: string;
  descripcion: string;
  prioridad: 'low' | 'medium' | 'high';
  estado: 'pending' | 'doing' | 'done';
  fechaEntrega: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  tasks: Task[] = [];

  constructor() {}

  ngOnInit() {
    // Datos simulados
    this.tasks = [
      { titulo: 'Tarea', descripcion: '.', prioridad: 'low', estado: 'pending', fechaEntrega: '2025-12-30' },
      { titulo: 'Entregar reporte PWA', descripcion: 'Resumen corto.', prioridad: 'high', estado: 'doing', fechaEntrega: '2025-10-04' },
      { titulo: 'Configurar Service Worker', descripcion: 'Cache estático y API.', prioridad: 'medium', estado: 'doing', fechaEntrega: '2025-10-01' },
      { titulo: 'Diseño de UI', descripcion: 'Pantallas básicas.', prioridad: 'low', estado: 'done', fechaEntrega: '2025-09-30' },
    ];
  }
}
