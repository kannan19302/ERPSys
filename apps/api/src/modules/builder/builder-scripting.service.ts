import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import vm from 'vm';

export interface ScriptResult {
  success: boolean;
  output: unknown;
  logs: string[];
  durationMs: number;
  error?: string;
}

const BLOCKED_GLOBALS = [
  'process', 'require', 'eval', 'Function',
  '__dirname', '__filename', 'module', 'exports',
  'globalThis', 'global',
];

const MAX_EXECUTION_MS = 3000;

@Injectable()
export class BuilderScriptingService {

  async executeScript(
    tenantId: string,
    script: string,
    context: Record<string, unknown> = {},
  ): Promise<ScriptResult> {
    if (!script || script.trim().length === 0) {
      throw new BadRequestException('Script body is required');
    }

    if (script.length > 50_000) {
      throw new BadRequestException('Script exceeds maximum length of 50,000 characters');
    }

    for (const blocked of BLOCKED_GLOBALS) {
      if (script.includes(blocked)) {
        throw new BadRequestException(`Script contains blocked reference: ${blocked}`);
      }
    }

    const logs: string[] = [];
    const sandbox: Record<string, unknown> = {
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
      },
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      undefined,
      null: null,
      NaN,
      Infinity,
      // Inject the record context
      record: context.record || {},
      tenant: { id: tenantId },
      params: context.params || {},
      result: undefined,
    };

    const vmContext = vm.createContext(sandbox);
    const start = Date.now();

    try {
      const compiled = new vm.Script(`(function() { ${script} })()`, {
        filename: 'builder-script.js',
      });

      const output = compiled.runInContext(vmContext, { timeout: MAX_EXECUTION_MS });
      const durationMs = Date.now() - start;

      return {
        success: true,
        output: output ?? sandbox.result,
        logs,
        durationMs,
      };
    } catch (err: any) {
      return {
        success: false,
        output: null,
        logs,
        durationMs: Date.now() - start,
        error: err.message || 'Script execution failed',
      };
    }
  }

  async executeFormHook(
    tenantId: string,
    formId: string,
    hookType: 'BEFORE_SAVE' | 'AFTER_SAVE' | 'ON_VALIDATE' | 'ON_LOAD',
    record: Record<string, unknown>,
  ): Promise<ScriptResult & { modifiedRecord?: Record<string, unknown> }> {
    const form = await prisma.builderForm.findFirst({
      where: { id: formId, tenantId },
    });
    if (!form) throw new BadRequestException('Form not found');

    const hooks = (form.settings && typeof form.settings === 'object')
      ? (form.settings as Record<string, unknown>)
      : {};

    const script = hooks[hookType] as string;
    if (!script) {
      return { success: true, output: null, logs: ['No hook configured'], durationMs: 0 };
    }

    const result = await this.executeScript(tenantId, script, { record, params: { hookType } });

    return {
      ...result,
      modifiedRecord: result.success ? (result.output as Record<string, unknown>) || record : undefined,
    };
  }

  async validateScript(script: string): Promise<{ valid: boolean; error?: string }> {
    try {
      new vm.Script(script, { filename: 'validation.js' });

      for (const blocked of BLOCKED_GLOBALS) {
        if (script.includes(blocked)) {
          return { valid: false, error: `Contains blocked reference: ${blocked}` };
        }
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  async getAvailableHooks() {
    return [
      { type: 'BEFORE_SAVE', description: 'Runs before a record is saved. Return modified record to alter data.' },
      { type: 'AFTER_SAVE', description: 'Runs after a record is saved. Use for side effects like notifications.' },
      { type: 'ON_VALIDATE', description: 'Runs on form validation. Throw an error to block submission.' },
      { type: 'ON_LOAD', description: 'Runs when a record is loaded. Can compute derived fields.' },
    ];
  }
}
