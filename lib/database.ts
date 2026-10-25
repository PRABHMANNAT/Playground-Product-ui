import 'server-only';
import { database as implementation } from '@/db/client.mjs';
interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T = Record<string, any>>(): Promise<T | null>;
  all<T = Record<string, any>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; changes: number }>;
}
export const database = implementation as unknown as { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
