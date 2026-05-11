import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('swap-router W3 safety gates', () => {
  it('requires explicit maxPriceUSDC for anchor swap instead of uint256 max', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/swap-router.ts'), 'utf8');

    expect(source).toContain('explicit maxPriceUSDC is required');
    expect(source).toContain('maxPriceUSDC,');
    expect(source).not.toContain('2n ** 256n - 1n');
    expect(source).not.toContain('uint256.max');
  });
});
