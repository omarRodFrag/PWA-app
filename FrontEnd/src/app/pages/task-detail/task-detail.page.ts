import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TaskService } from 'src/app/services/task';
import { Task } from 'src/app/interface/task.interface';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: false
})
export class TaskDetailPage implements OnInit {
  task: Task | null = null;
  loading: boolean = true;
  taskId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.taskId = +params['id'];
        this.loadTask();
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadTask() {
    if (!this.taskId) return;

    this.loading = true;
    // El interceptor agregará el token automáticamente
    this.taskService.obtenerTareaPorId(this.taskId, '').subscribe({
      next: (task: Task) => {
        this.task = task;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.presentToast('Error al cargar la tarea', 'danger');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger', duration = 2000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'top'
    });
    await toast.present();
  }

  editTask() {
    if (this.taskId) {
      this.router.navigate(['/task-form', this.taskId]);
    }
  }

  async deleteTask() {
    if (!this.taskId) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta tarea?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.performDelete();
          }
        }
      ]
    });

    await alert.present();
  }

  performDelete() {
    if (!this.taskId) return;

    // El interceptor agregará el token automáticamente
    this.taskService.eliminarTarea(this.taskId, '').subscribe({
      next: () => {
        this.presentToast('Tarea eliminada correctamente', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.presentToast('Error al eliminar la tarea', 'danger');
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getPrioridadColor(prioridad?: string): string {
    switch (prioridad) {
      case 'low': return 'low';
      case 'med': return 'med';
      case 'high': return 'high';
      default: return '';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }
}
