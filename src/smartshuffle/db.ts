export interface DbLike {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
  runAsync(sql: string, ...params: any[]): Promise<unknown>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}
