import { describe, it, expect } from 'vitest';
import { v1RunInput, v1DepositInput, v1CloseInput } from '@/lib/validators';

describe('v1RunInput', () => {
  it('accepts valid input with skill and input', () => {
    const result = v1RunInput.safeParse({ skill: 'web-scraper', input: { url: 'https://example.com' } });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with skill only (input optional)', () => {
    const result = v1RunInput.safeParse({ skill: 'echo-test' });
    expect(result.success).toBe(true);
  });

  it('rejects missing skill', () => {
    const result = v1RunInput.safeParse({ input: {} });
    expect(result.success).toBe(false);
  });

  it('rejects empty skill string', () => {
    const result = v1RunInput.safeParse({ skill: '' });
    expect(result.success).toBe(false);
  });

  it('allows extra fields to pass through', () => {
    const result = v1RunInput.safeParse({ skill: 'test', extra: 'data' });
    expect(result.success).toBe(true);
  });
});

describe('v1DepositInput', () => {
  it('accepts valid amount', () => {
    const result = v1DepositInput.safeParse({ amount: 10 });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = v1DepositInput.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = v1DepositInput.safeParse({ amount: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects amount over 100', () => {
    const result = v1DepositInput.safeParse({ amount: 150 });
    expect(result.success).toBe(false);
  });

  it('accepts boundary amount of 100', () => {
    const result = v1DepositInput.safeParse({ amount: 100 });
    expect(result.success).toBe(true);
  });
});

describe('v1CloseInput', () => {
  it('accepts valid session_id', () => {
    const result = v1CloseInput.safeParse({ session_id: 'clx123abc' });
    expect(result.success).toBe(true);
  });

  it('rejects empty session_id', () => {
    const result = v1CloseInput.safeParse({ session_id: '' });
    expect(result.success).toBe(false);
  });
});
