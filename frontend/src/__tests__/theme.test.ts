import { colors, typography, spacing, radius } from '../theme';

describe('Theme tokens', () => {
  it('has valid color values', () => {
    expect(colors.primary).toBe('#B99B68');
    expect(colors.background).toBe('#F5F0EA');
  });

  it('has valid spacing values', () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
    expect(spacing.lg).toBeLessThan(spacing.xl);
    expect(spacing.xl).toBeLessThan(spacing.xxl);
  });

  it('has valid radius values', () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.input);
    expect(radius.input).toBeLessThan(radius.card);
  });

  it('has typography styles', () => {
    expect(typography.body.fontSize).toBeGreaterThan(typography.bodySmall.fontSize);
  });
});
