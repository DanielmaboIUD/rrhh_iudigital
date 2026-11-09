export interface Dao<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(entidad: T): Promise<T>;
  update(id: number, entidad: T): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

export interface DaoPorFuncionario<T> extends Dao<T> {
  findAllByFuncionario(funcionarioId: number): Promise<T[]>;
}
