import { describe, it, expect, vi } from 'vitest';

// These tests validate the costing logic algorithms without hitting the database
describe('Inventory Costing Algorithms', () => {
  describe('FIFO cost layer consumption', () => {
    it('consumes oldest layers first', () => {
      const layers = [
        { qty: 10, cost: 5.00, remaining: 10 },
        { qty: 20, cost: 6.00, remaining: 20 },
        { qty: 15, cost: 7.00, remaining: 15 },
      ];

      let toConsume = 25;
      let totalCostConsumed = 0;

      for (const layer of layers) {
        if (toConsume <= 0) break;
        const consume = Math.min(layer.remaining, toConsume);
        totalCostConsumed += consume * layer.cost;
        layer.remaining -= consume;
        toConsume -= consume;
      }

      // 10 * 5 + 15 * 6 = 50 + 90 = 140
      expect(totalCostConsumed).toBe(140);
      expect(layers[0]!.remaining).toBe(0);
      expect(layers[1]!.remaining).toBe(5);
      expect(layers[2]!.remaining).toBe(15);
    });
  });

  describe('LIFO cost layer consumption', () => {
    it('consumes newest layers first', () => {
      const layers = [
        { qty: 10, cost: 5.00, remaining: 10 },
        { qty: 20, cost: 6.00, remaining: 20 },
        { qty: 15, cost: 7.00, remaining: 15 },
      ];

      let toConsume = 25;
      let totalCostConsumed = 0;

      for (let i = layers.length - 1; i >= 0; i--) {
        if (toConsume <= 0) break;
        const layer = layers[i]!;
        const consume = Math.min(layer.remaining, toConsume);
        totalCostConsumed += consume * layer.cost;
        layer.remaining -= consume;
        toConsume -= consume;
      }

      // 15 * 7 + 10 * 6 = 105 + 60 = 165
      expect(totalCostConsumed).toBe(165);
      expect(layers[2]!.remaining).toBe(0);
      expect(layers[1]!.remaining).toBe(10);
      expect(layers[0]!.remaining).toBe(10);
    });
  });

  describe('Weighted average cost', () => {
    it('calculates correct weighted average', () => {
      const receipts = [
        { qty: 100, unitCost: 10 },
        { qty: 200, unitCost: 12 },
        { qty: 50, unitCost: 15 },
      ];

      const totalQty = receipts.reduce((s, r) => s + r.qty, 0);
      const totalValue = receipts.reduce((s, r) => s + r.qty * r.unitCost, 0);
      const avgCost = totalValue / totalQty;

      // (100*10 + 200*12 + 50*15) / 350 = (1000+2400+750)/350 = 4150/350 = 11.857...
      expect(totalQty).toBe(350);
      expect(totalValue).toBe(4150);
      expect(Math.round(avgCost * 100) / 100).toBe(11.86);
    });
  });

  describe('Landed cost allocation', () => {
    it('allocates by value proportionally', () => {
      const items = [
        { value: 1000, qty: 10 },
        { value: 3000, qty: 20 },
      ];
      const totalValue = items.reduce((s, i) => s + i.value, 0);
      const freightCost = 200;

      const allocations = items.map(item => ({
        originalCost: item.value,
        freightAlloc: Math.round((item.value / totalValue) * freightCost * 100) / 100,
      }));

      expect(allocations[0]!.freightAlloc).toBe(50); // 1000/4000 * 200
      expect(allocations[1]!.freightAlloc).toBe(150); // 3000/4000 * 200
    });
  });
});
