import { describe, it, expect } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('should have HOME route', () => {
    expect(ROUTES.HOME).toBe('/');
  });

  it('should have PRINT route', () => {
    expect(ROUTES.PRINT).toBe('/print');
  });

  it('should have SHARE function', () => {
    expect(typeof ROUTES.SHARE).toBe('function');
    expect(ROUTES.SHARE('abc123')).toBe('/s/abc123');
    expect(ROUTES.SHARE('xyz')).toBe('/s/xyz');
  });

  it('should have SHARE_PATTERN route', () => {
    expect(ROUTES.SHARE_PATTERN).toBe('/s/:encoded');
  });
});
