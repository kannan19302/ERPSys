import { vi } from "vitest";

/**
 * Jest-API compatibility shim.
 *
 * Part of this suite predates the move to Vitest and calls `jest.fn()`,
 * `jest.spyOn()`, `jest.clearAllMocks()` and friends. Under Vitest those files
 * die at runtime with "jest is not defined" — 53 failures that look like broken
 * tests but are purely a missing alias.
 *
 * `vi` implements the same surface for everything these files use, so exposing
 * it as `jest` makes them run without editing 50-odd files or changing what a
 * single assertion means.
 *
 * One deliberate limitation: `vi.mock` is hoisted above imports by the Vitest
 * transform, and a `jest.mock(...)` call reached through this alias is NOT — it
 * runs in place, after the module under test has already been imported. Files
 * that need module mocking must call `vi.mock` directly. This shim is for the
 * spy/stub API only, and is not a licence to write new Jest-style tests.
 */
Object.defineProperty(globalThis, "jest", {
  value: vi,
  writable: true,
  configurable: true,
});
