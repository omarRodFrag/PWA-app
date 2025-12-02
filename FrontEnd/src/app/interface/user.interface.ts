export interface User {
  _id?: string;
  idUsuario: number;
  strEmail: string;
  strNombre?: string;
  rol?: 'alumno' | 'administrador';
  fechaRegistro?: string;
  ultimaActualizacion?: string;
}
