import { Injectable, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { SandboxRunner, type HostCapabilities } from "@unerp/sandbox";

export interface ScriptResult {
  success: boolean;
  output: unknown;
  logs: string[];
  durationMs: number;
  error?: string;
}

const MAX_EXECUTION_MS = 3000;

/**
 * Studio scripting — § 14 Phase 5: the builder becomes a *client* of the public
 * extension API, "with no privileged path".
 *
 * This previously ran tenant-authored scripts through `node:vm`, guarded by a
 * denylist of blocked substrings (`script.includes("process")`). Both halves
 * were ineffective:
 *
 *   - `node:vm` is not an isolation boundary; Node's own documentation says so.
 *     A `vm.createContext` sandbox shares a heap with the host and is escapable
 *     in one expression.
 *   - A substring denylist is defeated by construction rather than reference:
 *     `this["constr"+"uctor"]["constr"+"uctor"]("return pro"+"cess")()` contains
 *     none of the blocked strings. Denylisting text cannot constrain a language
 *     that can build any identifier at runtime.
 *
 * That mattered more here than in the extension sandbox it mirrors, because
 * this path is *live*: a Studio user writes a form hook or validation rule and
 * it executes inside the API process.
 *
 * It now runs on the same `SandboxRunner` as third-party extensions — a V8
 * isolate with its own heap, no `process`, no `require`, no ambient authority,
 * and a hard CPU and memory budget. First-party Studio code gets no privileged
 * shortcut, which is the property § 14 Phase 5 asks for.
 */
@Injectable()
export class BuilderScriptingService {
  private readonly sandbox = new SandboxRunner();

  async executeScript(
    tenantId: string,
    script: string,
    context: Record<string, unknown> = {},
  ): Promise<ScriptResult> {
    if (!script || script.trim().length === 0) {
      throw new BadRequestException("Script body is required");
    }

    if (script.length > 50_000) {
      throw new BadRequestException(
        "Script exceeds maximum length of 50,000 characters",
      );
    }

    const logs: string[] = [];
    const host: HostCapabilities = {
      log: (level, _meta, args) => {
        // The bridge always passes (message, meta) and meta is null when the
        // caller omitted it — rendering that as the string "null" would put a
        // word in the author's log line that they did not write.
        const line = args
          .filter((a) => a !== null && a !== undefined)
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" ");
        logs.push(level === "error" ? `[ERROR] ${line}` : line);
      },
    };

    // The script body is wrapped as a hook so the isolate contract is the same
    // one extensions use. `record`, `tenant` and `params` arrive as arguments
    // rather than as injected globals — a value passed in cannot be a handle
    // reached out through.
    const wrapped =
      `const hooks = { main: function (record, tenant, params) {\n` +
      `${script}\n` +
      `} };`;

    const start = Date.now();
    try {
      const { result } = await this.sandbox.run(
        wrapped,
        {
          extensionId: `studio-script:${tenantId}`,
          tenantId,
          scopes: ["log:write"],
          budget: { timeoutMs: MAX_EXECUTION_MS, memoryMb: 32 },
        },
        host,
        {
          hook: "main",
          args: [context.record ?? {}, { id: tenantId }, context.params ?? {}],
        },
      );

      return {
        success: true,
        output: result,
        logs,
        durationMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        success: false,
        output: null,
        logs,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Script execution failed",
      };
    }
  }

  async executeFormHook(
    tenantId: string,
    formId: string,
    hookType: "BEFORE_SAVE" | "AFTER_SAVE" | "ON_VALIDATE" | "ON_LOAD",
    record: Record<string, unknown>,
  ): Promise<ScriptResult & { modifiedRecord?: Record<string, unknown> }> {
    const form = await prisma.builderForm.findFirst({
      where: { id: formId, tenantId },
    });
    if (!form) throw new BadRequestException("Form not found");

    const hooks =
      form.settings && typeof form.settings === "object"
        ? (form.settings as Record<string, unknown>)
        : {};

    const script = hooks[hookType] as string;
    if (!script) {
      return {
        success: true,
        output: null,
        logs: ["No hook configured"],
        durationMs: 0,
      };
    }

    const result = await this.executeScript(tenantId, script, {
      record,
      params: { hookType },
    });

    return {
      ...result,
      modifiedRecord: result.success
        ? (result.output as Record<string, unknown>) || record
        : undefined,
    };
  }

  async validateScript(
    script: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Syntax check only, and honest about being only that.
      //
      // This used to also apply the substring denylist and report a script as
      // "valid: false — contains blocked reference". That gave authors a false
      // model of what constrains them: the denylist never constrained anything
      // (it is defeated by string concatenation), and the real constraint is
      // the isolate, which has no `process` or `require` to reference in the
      // first place. Reporting a fake rule as the boundary teaches people to
      // code around the wrong thing.
      //
      // Compiling in an isolate rather than node:vm keeps even the syntax check
      // off the host heap.
      const probe = new SandboxRunner();
      await probe.run(
        `const hooks = { main: function () { return true; } };\n` +
          `void (function () {\n${script}\n});`,
        {
          extensionId: "studio-script-validation",
          tenantId: "validation",
          scopes: [],
          budget: { timeoutMs: 1000, memoryMb: 16 },
        },
        { log: () => {} },
        { hook: "main" },
      );

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  async getAvailableHooks() {
    return [
      {
        type: "BEFORE_SAVE",
        description:
          "Runs before a record is saved. Return modified record to alter data.",
      },
      {
        type: "AFTER_SAVE",
        description:
          "Runs after a record is saved. Use for side effects like notifications.",
      },
      {
        type: "ON_VALIDATE",
        description:
          "Runs on form validation. Throw an error to block submission.",
      },
      {
        type: "ON_LOAD",
        description:
          "Runs when a record is loaded. Can compute derived fields.",
      },
    ];
  }
}
