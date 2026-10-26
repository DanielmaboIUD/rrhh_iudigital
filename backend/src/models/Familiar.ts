export interface Familiar {
  id?: number;
  funcionario_id: number;
  parentesco_id: number;
  tipo_identificacion_id: number;
  numero_identificacion: string;
  nombres: string;
  apellidos: string;
  sexo_id: number;
  fecha_nacimiento: string;
  telefono: string | null;
}
