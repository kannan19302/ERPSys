import { describe, it, expect } from 'vitest';

describe('Pricing Engine Logic', () => {
  const applyVolumeDiscount = (qty: number): { pct: number; rule: string } => {
    if (qty >= 1000) return { pct: 15, rule: 'VOLUME_1000+' };
    if (qty >= 500) return { pct: 10, rule: 'VOLUME_500+' };
    if (qty >= 100) return { pct: 5, rule: 'VOLUME_100+' };
    if (qty >= 50) return { pct: 3, rule: 'VOLUME_50+' };
    return { pct: 0, rule: 'STANDARD' };
  };

  it('returns 15% discount for 1000+ units', () => {
    expect(applyVolumeDiscount(1500)).toEqual({ pct: 15, rule: 'VOLUME_1000+' });
  });

  it('returns 10% discount for 500-999 units', () => {
    expect(applyVolumeDiscount(750)).toEqual({ pct: 10, rule: 'VOLUME_500+' });
  });

  it('returns 5% discount for 100-499 units', () => {
    expect(applyVolumeDiscount(200)).toEqual({ pct: 5, rule: 'VOLUME_100+' });
  });

  it('returns 3% discount for 50-99 units', () => {
    expect(applyVolumeDiscount(75)).toEqual({ pct: 3, rule: 'VOLUME_50+' });
  });

  it('returns 0% for small orders', () => {
    expect(applyVolumeDiscount(10)).toEqual({ pct: 0, rule: 'STANDARD' });
  });

  it('calculates final price correctly with 10% discount', () => {
    const basePrice = 25.00;
    const qty = 500;
    const discountPct = 10;
    const finalPrice = Math.round(basePrice * qty * (1 - discountPct / 100) * 100) / 100;
    expect(finalPrice).toBe(11250);
  });

  describe('Customer tier overrides', () => {
    const resolveDiscount = (volumePct: number, tier: string): number => {
      let tierPct = 0;
      if (tier === 'PLATINUM') tierPct = 20;
      else if (tier === 'GOLD') tierPct = 12;
      else if (tier === 'SILVER') tierPct = 8;
      return Math.max(volumePct, tierPct);
    };

    it('platinum overrides volume discount', () => {
      expect(resolveDiscount(10, 'PLATINUM')).toBe(20);
    });

    it('large volume overrides silver', () => {
      expect(resolveDiscount(15, 'SILVER')).toBe(15);
    });
  });
});
