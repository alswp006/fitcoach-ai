export interface StorageResult<T> {
  ok: boolean;
  data?: T;
  error?: 'PARSE_ERROR' | 'NOT_FOUND';
}
