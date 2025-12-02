import { Component, OnInit } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Platform } from '@ionic/angular';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isOnline: boolean = true;

  constructor(
    private swUpdate: SwUpdate,
    private platform: Platform
  ) {}

  ngOnInit() {
    // Verificar actualizaciones del Service Worker
    if (this.swUpdate.isEnabled) {
      // Verificar actualizaciones periódicamente
      this.swUpdate.checkForUpdate().then(() => {
        console.log('Service Worker: Verificando actualizaciones...');
      });

      // Escuchar actualizaciones disponibles
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
        )
        .subscribe(evt => {
          console.log('Nueva versión disponible. Activando y recargando...');
          // Activar la nueva versión y recargar
          this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
          });
        });

      // Escuchar otros eventos de actualización
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_DETECTED') {
          console.log('Nueva versión detectada');
        } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('Error al instalar nueva versión');
        }
      });
    }

    // Detectar estado de conexión
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Conexión restaurada');
      // Verificar actualizaciones cuando se restaura la conexión
      if (this.swUpdate.isEnabled) {
        this.swUpdate.checkForUpdate();
      }
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Sin conexión - Modo offline activado');
    });
  }
}
