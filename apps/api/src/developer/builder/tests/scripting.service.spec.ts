import { describe, it, expect } from "vitest";
import { BuilderScriptingService } from "../builder-scripting.service";

describe("BuilderScriptingService", () => {
  const service = new BuilderScriptingService();

  describe("validateScript", () => {
    it("validates a simple script", async () => {
      const result = await service.validateScript("var x = 1 + 2;");
      expect(result.valid).toBe(true);
    });

    // These three previously asserted that validateScript rejected any script
    // *containing* the substrings "process", "require" or "eval". That denylist
    // has been removed because it never constrained anything: it is defeated by
    // `this["constr"+"uctor"]`, which contains none of those strings. Asserting
    // it here made the suite vouch for a guarantee that did not exist.
    //
    // The real boundary is the V8 isolate the script now runs in, which has no
    // such bindings to reference. What validateScript reports is syntax.
    it("accepts a syntactically valid script, whatever identifiers it names", async () => {
      const result = await service.validateScript(
        "const processed = 1; return processed;",
      );
      expect(result.valid).toBe(true);
    });

    it("rejects a script that does not parse", async () => {
      const result = await service.validateScript("return (;");
      expect(result.valid).toBe(false);
    });

    it("leaves a reference to `process` unresolvable rather than unmentionable", async () => {
      const result = await service.executeScript(
        "test-tenant",
        "return typeof process;",
      );
      expect(result.success).toBe(true);
      expect(result.output).toBe("undefined");
    });
  });

  describe("executeScript", () => {
    it("executes a simple calculation", async () => {
      const result = await service.executeScript(
        "test-tenant",
        "return 2 + 3;",
      );
      expect(result.success).toBe(true);
      expect(result.output).toBe(5);
    });

    it("provides a captured log capability", async () => {
      // `console` is not injected: the isolate receives an explicit `unierp.log`
      // capability instead, so logging is a granted operation rather than an
      // ambient global. TRD § 3 bans console.* platform-wide in any case.
      const result = await service.executeScript(
        "test-tenant",
        'unierp.log("hello"); return 42;',
      );
      expect(result.success).toBe(true);
      expect(result.output).toBe(42);
      expect(result.logs).toContain("hello");
    });

    it("provides record context", async () => {
      const result = await service.executeScript(
        "test-tenant",
        "return record.name;",
        { record: { name: "Test" } },
      );
      expect(result.success).toBe(true);
      expect(result.output).toBe("Test");
    });

    it("handles errors gracefully", async () => {
      const result = await service.executeScript(
        "test-tenant",
        'throw new Error("boom");',
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("boom");
    });

    it("rejects empty script", async () => {
      await expect(service.executeScript("test-tenant", "")).rejects.toThrow();
    });

    it("cannot reach the host process", async () => {
      // Previously this threw "blocked" from a substring check before the script
      // ran. Now the script runs, and fails because there is no `process` in the
      // isolate to exit — the difference between forbidding a word and removing
      // the capability.
      const result = await service.executeScript(
        "test-tenant",
        "process.exit()",
      );
      expect(result.success).toBe(false);
      expect(String(result.error)).toMatch(/not defined/i);
    });
  });

  describe("getAvailableHooks", () => {
    it("returns 4 hook types", async () => {
      const hooks = await service.getAvailableHooks();
      expect(hooks.length).toBe(4);
      expect(hooks.map((h) => h.type)).toEqual([
        "BEFORE_SAVE",
        "AFTER_SAVE",
        "ON_VALIDATE",
        "ON_LOAD",
      ]);
    });
  });
});
