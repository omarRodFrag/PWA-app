export interface Task {
  _id?: string;
  idTarea: number;
  titulo: string;
  descripcion?: string;
  fechaEntrega?: string;
  prioridad?: 'low' | 'med' | 'high';
  estado?: string; // todo | doing | done
  usuarioAsignado?: number;
  creador?: number;
  fechaRegistro?: string;
  ultimaActualizacion?: string;
}
