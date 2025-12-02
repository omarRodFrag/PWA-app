import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TaskService } from 'src/app/services/task';
import { AuthService } from 'src/app/services/auth';
import { User } from 'src/app/interface/user.interface';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  loading: boolean = true;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.loading = true;
    const token = localStorage.getItem('auth_token') || '';

    // Obtener idUsuario del token
    let idUsuario: number | null = null;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      idUsuario = tokenPayload.idUsuario;
    } catch (e) {
      console.error('Error al decodificar token:', e);
      this.loading = false;
      this.presentToast('Error al obtener información del usuario', 'danger');
      return;
    }

    if (!idUsuario) {
      this.loading = false;
      return;
    }

    // El interceptor agregará el token automáticamente
    this.taskService.obtenerUsuarioPorId(idUsuario, '').subscribe({
      next: (user: User) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.presentToast('Error al cargar el perfil', 'danger');
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

  logout() {
    this.authService.clearSession();
    this.presentToast('Sesión cerrada correctamente', 'success');
    this.router.navigate(['/login']);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';
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

  getRolColor(rol?: string): string {
    return rol === 'administrador' ? 'admin' : 'alumno';
  }

  getRolLabel(rol?: string): string {
    return rol === 'administrador' ? 'Administrador' : 'Alumno';
  }
}
