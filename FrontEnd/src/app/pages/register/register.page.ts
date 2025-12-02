import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
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

  register() {
    if (this.registerForm.invalid) {
      this.presentToast('Por favor, completa todos los campos correctamente.', 'danger', 2200);
      return;
    }

    this.isLoading = true;

    const registerData = {
      strNombre: this.registerForm.value.nombre,
      strEmail: this.registerForm.value.email,
      strPassword: this.registerForm.value.password
    };

    this.authService.register(registerData).subscribe({
      next: async (response: any) => {
        this.isLoading = false;
        if (response?.message) {
          await this.presentToast('Registro exitoso. Redirigiendo al login...', 'success', 2000);
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          await this.presentToast(response?.error || 'Error al registrar usuario', 'danger', 2200);
        }
      },
      error: async (error: any) => {
        this.isLoading = false;
        const mensaje =
          error.error?.error ||
          error.error?.message ||
          error.message ||
          'Ocurrió un error al registrar. Inténtalo de nuevo.';
        await this.presentToast(mensaje, 'danger', 2500);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

