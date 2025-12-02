import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { TaskService } from 'src/app/services/task';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth';
import { Task } from 'src/app/interface/task.interface';
import { User } from 'src/app/interface/user.interface';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.page.html',
  styleUrls: ['./task-form.page.scss'],
  standalone: false
})
export class TaskFormPage implements OnInit {
  taskForm!: FormGroup;
  isEditMode: boolean = false;
  taskId?: number;
  loading: boolean = false;
  loadingTask: boolean = false;
  isAdmin: boolean = false;
  users: User[] = [];
  loadingUsers: boolean = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.taskForm = this.fb.group({
      titulo: ['', [Validators.required]],
      descripcion: [''],
      fechaEntrega: [''],
      prioridad: ['med', [Validators.required]],
      estado: ['todo', [Validators.required]],
      usuarioAsignado: [null]
    });
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    
    // Si es admin, cargar lista de usuarios
    if (this.isAdmin) {
      this.loadUsers();
    } else {
      // Si no es admin, asignar al usuario actual
      const token = localStorage.getItem('auth_token') || '';
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        this.taskForm.patchValue({ usuarioAsignado: tokenPayload.idUsuario });
      } catch (e) {
        console.warn('No se pudo obtener idUsuario del token');
      }
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.taskId = +params['id'];
        this.loadTask();
      }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.userService.obtenerUsuarios().subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
      },
      error: (err) => {
        this.loadingUsers = false;
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  loadTask() {
    if (!this.taskId) return;
    
    this.loadingTask = true;
    // El interceptor agregará el token automáticamente
    this.taskService.obtenerTareaPorId(this.taskId, '').subscribe({
      next: (task: Task) => {
        // Formatear fecha para el input date (YYYY-MM-DD)
        const fechaEntrega = task.fechaEntrega ? task.fechaEntrega.split('T')[0] : '';
        
        this.taskForm.patchValue({
          titulo: task.titulo,
          descripcion: task.descripcion || '',
          fechaEntrega: fechaEntrega,
          prioridad: task.prioridad || 'med',
          estado: task.estado || 'todo',
          usuarioAsignado: task.usuarioAsignado || null
        });
        this.loadingTask = false;
      },
      error: (err) => {
        this.loadingTask = false;
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

  onSubmit() {
    if (this.taskForm.invalid) {
      this.presentToast('Por favor, completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;
    const token = localStorage.getItem('auth_token') || '';
    const formValue = this.taskForm.value;

    // Obtener idUsuario del token
    let idUsuario = 1; // Default
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      idUsuario = tokenPayload.idUsuario;
    } catch (e) {
      console.warn('No se pudo obtener idUsuario del token');
    }

    // Si es admin y seleccionó un usuario, usar ese. Si no, usar el usuario actual
    const usuarioAsignado = this.isAdmin && formValue.usuarioAsignado 
      ? formValue.usuarioAsignado 
      : idUsuario;

    const taskData: Partial<Task> = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion || '',
      fechaEntrega: formValue.fechaEntrega || '',
      prioridad: formValue.prioridad,
      estado: formValue.estado,
      creador: idUsuario,
      usuarioAsignado: usuarioAsignado
    };

    if (this.isEditMode && this.taskId) {
      // Actualizar tarea existente - el interceptor agregará el token
      this.taskService.actualizarTarea(this.taskId, taskData, '').subscribe({
        next: () => {
          this.loading = false;
          this.presentToast('Tarea actualizada correctamente', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.presentToast('Error al actualizar la tarea', 'danger');
        }
      });
    } else {
      // Crear nueva tarea - el interceptor agregará el token
      this.taskService.agregarTarea(taskData, '').subscribe({
        next: () => {
          this.loading = false;
          this.presentToast('Tarea creada correctamente', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.presentToast('Error al crear la tarea', 'danger');
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
