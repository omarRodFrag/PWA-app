import { Injectable } from '@angular/core';
import { Task } from '../interface/task.interface';

export interface TaskNotification {
  task: Task;
  daysUntilDue: number;
  isUrgent: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly URGENT_THRESHOLD_DAYS = 1; // Tareas urgentes: menos de 1 día
  private readonly WARNING_THRESHOLD_DAYS = 3; // Tareas próximas: menos de 3 días

  constructor() {}

  /**
   * Obtiene notificaciones de tareas próximas a vencer
   */
  getUpcomingTasks(tasks: Task[]): TaskNotification[] {
    const now = new Date();
    const notifications: TaskNotification[] = [];

    tasks.forEach(task => {
      if (!task.fechaEntrega || task.estado === 'done') {
        return; // Saltar tareas sin fecha o completadas
      }

      const dueDate = new Date(task.fechaEntrega);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Solo incluir tareas que están próximas a vencer (próximas 7 días)
      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        const isUrgent = daysUntilDue <= this.URGENT_THRESHOLD_DAYS;
        const isWarning = daysUntilDue <= this.WARNING_THRESHOLD_DAYS && !isUrgent;

        let message = '';
        if (isUrgent) {
          message = daysUntilDue === 0 
            ? 'Vence hoy' 
            : `Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`;
        } else if (isWarning) {
          message = `Vence en ${daysUntilDue} días`;
        } else {
          message = `Vence en ${daysUntilDue} días`;
        }

        notifications.push({
          task,
          daysUntilDue,
          isUrgent,
          message
        });
      }
    });

    // Ordenar por urgencia y días restantes
    return notifications.sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) {
        return a.isUrgent ? -1 : 1;
      }
      return a.daysUntilDue - b.daysUntilDue;
    });
  }

  /**
   * Obtiene el número de tareas urgentes
   */
  getUrgentTasksCount(tasks: Task[]): number {
    return this.getUpcomingTasks(tasks).filter(n => n.isUrgent).length;
  }

  /**
   * Obtiene el número total de notificaciones
   */
  getNotificationsCount(tasks: Task[]): number {
    return this.getUpcomingTasks(tasks).length;
  }

  /**
   * Verifica si hay notificaciones
   */
  hasNotifications(tasks: Task[]): boolean {
    return this.getNotificationsCount(tasks) > 0;
  }

  /**
   * Solicita permiso para notificaciones del navegador (opcional)
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Muestra notificación del navegador (opcional)
   */
  async showBrowserNotification(notification: TaskNotification): Promise<void> {
    if (await this.requestNotificationPermission()) {
      new Notification(`Tarea próxima: ${notification.task.titulo}`, {
        body: notification.message,
        icon: '/assets/icon/favicon.png',
        badge: '/assets/icon/favicon.png',
        tag: `task-${notification.task.idTarea}`,
        requireInteraction: notification.isUrgent
      });
    }
  }
}

