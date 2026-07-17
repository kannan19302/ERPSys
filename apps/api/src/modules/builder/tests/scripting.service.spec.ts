import { describe, it, expect } from 'vitest';
import { BuilderScriptingService } from '../builder-scripting.service';

describe('BuilderScriptingService', () => {
  const service = new BuilderScriptingService();

  describe('validateScript', () => {
    it('validates a simple script', async () => {
      const result = await service.validateScript('var x = 1 + 2;');
      expect(result.valid).toBe(true);
    });

    it('rejects script with process reference', async () => {
      const result = await service.validateScript('process.exit(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('process');
    });

    it('rejects script with require', async () => {
      const result = await service.validateScript('const fs = require("fs")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('require');
    });

    it('rejects script with eval', async () => {
      const result = await service.validateScript('eval("1+1")');
      expect(result.valid).toBe(false);
    });
  });

  describe('executeScript', () => {
    it('executes a simple calculation', async () => {
      const result = await service.executeScript('test-tenant', 'return 2 + 3;');
      expect(result.success).toBe(true);
      expect(result.output).toBe(5);
    });

    it('provides console.log access', async () => {
      const result = await service.executeScript('test-tenant', 'console.log("hello"); return 42;');
      expect(result.success).toBe(true);
      expect(result.output).toBe(42);
      expect(result.logs).toContain('hello');
    });

    it('provides record context', async () => {
      const result = await service.executeScript('test-tenant', 'return record.name;', { record: { name: 'Test' } });
      expect(result.success).toBe(true);
      expect(result.output).toBe('Test');
    });

    it('handles errors gracefully', async () => {
      const result = await service.executeScript('test-tenant', 'throw new Error("boom");');
      expect(result.success).toBe(false);
      expect(result.error).toContain('boom');
    });

    it('rejects empty script', async () => {
      await expect(service.executeScript('test-tenant', '')).rejects.toThrow();
    });

    it('rejects blocked globals', async () => {
      await expect(service.executeScript('test-tenant', 'process.exit()')).rejects.toThrow('blocked');
    });
  });

  describe('getAvailableHooks', () => {
    it('returns 4 hook types', async () => {
      const hooks = await service.getAvailableHooks();
      expect(hooks.length).toBe(4);
      expect(hooks.map(h => h.type)).toEqual(['BEFORE_SAVE', 'AFTER_SAVE', 'ON_VALIDATE', 'ON_LOAD']);
    });
  });
});
