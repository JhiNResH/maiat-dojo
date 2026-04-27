import { describe, expect, it } from 'vitest';
import { databaseUrlWithPrismaPool } from '@/lib/prisma';

describe('databaseUrlWithPrismaPool', () => {
  it('adds conservative Prisma pool params to Postgres URLs', () => {
    const url = databaseUrlWithPrismaPool('postgresql://user:pass@example.com:5432/db?sslmode=require');
    const parsed = new URL(url!);

    expect(parsed.searchParams.get('sslmode')).toBe('require');
    expect(parsed.searchParams.get('connection_limit')).toBe('1');
    expect(parsed.searchParams.get('pool_timeout')).toBe('10');
    expect(parsed.searchParams.get('connect_timeout')).toBe('10');
  });

  it('does not override existing pool params', () => {
    const url = databaseUrlWithPrismaPool(
      'postgresql://user:pass@example.com:5432/db?connection_limit=3&pool_timeout=20&connect_timeout=15',
    );
    const parsed = new URL(url!);

    expect(parsed.searchParams.get('connection_limit')).toBe('3');
    expect(parsed.searchParams.get('pool_timeout')).toBe('20');
    expect(parsed.searchParams.get('connect_timeout')).toBe('15');
  });

  it('leaves non-Postgres URLs unchanged', () => {
    expect(databaseUrlWithPrismaPool('file:./test.db')).toBe('file:./test.db');
  });

  it('leaves missing database URLs unset for build-time imports', () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(databaseUrlWithPrismaPool()).toBeUndefined();
    } finally {
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }
  });
});
