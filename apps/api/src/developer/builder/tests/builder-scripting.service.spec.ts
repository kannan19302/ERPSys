import { describe, it, expect } from "vitest";
import { BuilderScriptingService } from "../builder-scripting.service";

/**
 * Studio scripting runs code a tenant user wrote, inside the API process.
 * It previously used `node:vm` guarded by a denylist of blocked substrings;
 * these tests are the escapes that combination allowed.
 */
describe("BuilderScriptingService", () => {
  const service = new BuilderScriptingService();

  it("runs a script and returns its value", async () => {
    const result = await service.executeScript("t1", "return record.qty * 2;", {
      record: { qty: 21 },
    });
    expect(result.success).toBe(true);
    expect(result.output).toBe(42);
  });

  it("passes tenant and params in as arguments, not ambient globals", async () => {
    const result = await service.executeScript(
      "t1",
      "return tenant.id + ':' + params.mode;",
      { params: { mode: "draft" } },
    );
    expect(result.output).toBe("t1:draft");
  });

  it("captures console output without touching the host console", async () => {
    const result = await service.executeScript(
      "t1",
      "unierp.log('hello'); return 1;",
    );
    expect(result.logs).toContain("hello");
  });

  it("defeats the escape the substring denylist allowed", async () => {
    // The old guard rejected any script *containing* "process", "require" or
    // "constructor". It never saw this, because the identifier is built at
    // runtime rather than written:
    const escape = `
      const c = this["constr" + "uctor"];
      const f = c["constr" + "uctor"];
      return f("return pro" + "cess")().pid;
    `;
    const result = await service.executeScript("t1", escape);
    expect(result.success).toBe(false);
    // In an isolate there is no host process to reach at all.
    expect(String(result.error)).toMatch(/not defined|undefined|process/i);
  });

  it("has no require, no process and no host globals", async () => {
    const result = await service.executeScript(
      "t1",
      "return [typeof require, typeof process, typeof fetch, typeof Buffer].join(',');",
    );
    expect(result.output).toBe("undefined,undefined,undefined,undefined");
  });

  it("stops a runaway loop at the deadline instead of hanging the API", async () => {
    const result = await service.executeScript("t1", "while (true) {}");
    expect(result.success).toBe(false);
    expect(String(result.error)).toMatch(/timed out/i);
  }, 20_000);

  it("reports a syntax error as invalid", async () => {
    const check = await service.validateScript("return (;");
    expect(check.valid).toBe(false);
  });

  it("no longer reports a fake denylist rule as the boundary", async () => {
    // `process` appears as a plain identifier here. The old validator called it
    // invalid, teaching authors that the string was the rule. It is not — the
    // isolate is, and it simply has no such binding.
    const check = await service.validateScript(
      "const processed = 1; return processed;",
    );
    expect(check.valid).toBe(true);
  });
});
