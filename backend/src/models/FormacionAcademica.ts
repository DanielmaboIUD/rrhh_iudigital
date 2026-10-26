export interface FormacionAcademica {
  id?: number;
  funcionario_id: number;
  universidad_id: number;
  nivel_estudio_id: number;
  titulo: string;
  fecha_grado: string | null;
}
