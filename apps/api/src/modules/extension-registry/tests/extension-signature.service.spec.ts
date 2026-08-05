import { describe, it, expect, beforeAll } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { ExtensionSignatureService } from "../extension-signature.service";
import type { BundleFile, SignedBundle } from "@unerp/extension-api";

/**
 * § 8.2 / § 10 — a bundle's signature must cover everything an attacker would
 * want to change in transit. Each test below is a specific tampering attempt.
 */
describe("ExtensionSignatureService", () => {
  let service: ExtensionSignatureService;
  let privateKeyDer: Buffer;
  const keyId = "acme-key-1";

  const code = `const hooks = { go: () => 1 };`;
  const manifest = {
    id: "acme-widget",
    name: "Acme Widget",
    version: "1.0.0",
    publisher: "Acme Ltd",
    scopes: ["log:write"],
    entryPoint: "index.js",
  };

  const files: BundleFile[] = [
    {
      path: "index.js",
      sha256: ExtensionSignatureService.hashFile(code),
      bytes: Buffer.byteLength(code),
    },
  ];

  const contents = new Map<string, string>([["index.js", code]]);

  const makeBundle = (): SignedBundle => ({
    manifest,
    files,
    signature: ExtensionSignatureService.sign({
      manifest,
      files,
      privateKeyDer,
      keyId,
    }),
  });

  beforeAll(() => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    privateKeyDer = privateKey.export({
      format: "der",
      type: "pkcs8",
    }) as Buffer;
    const publicDer = publicKey.export({
      format: "der",
      type: "spki",
    }) as Buffer;

    service = new ExtensionSignatureService();
    service.registerKey({
      keyId,
      publisher: "Acme Ltd",
      publicKey: publicDer.toString("base64"),
      revoked: false,
    });
  });

  it("accepts a correctly signed, unmodified bundle", () => {
    expect(() => service.verify(makeBundle(), contents)).not.toThrow();
  });

  it("rejects a bundle whose CODE was modified after signing", () => {
    const tampered = new Map([
      ["index.js", `const hooks = { go: () => 666 };`],
    ]);
    expect(() => service.verify(makeBundle(), tampered)).toThrow(
      /does not match its signed hash/,
    );
  });

  it("rejects scope escalation in the manifest after signing", () => {
    // The attack the digest exists to stop: keep a valid code hash, rewrite the
    // manifest to request data:write and a new egress host.
    const bundle = makeBundle();
    const escalated = {
      ...bundle,
      manifest: {
        ...manifest,
        scopes: ["log:write", "data:write", "http:fetch"],
      },
    };
    expect(() => service.verify(escalated, contents)).toThrow(
      /signature is invalid/,
    );
  });

  it("rejects an extra file smuggled into the bundle", () => {
    const extra = new Map(contents);
    extra.set("evil.js", "process.exit(1)");
    expect(() => service.verify(makeBundle(), extra)).toThrow(
      /not in the signed file list/,
    );
  });

  it("rejects a declared file that is missing", () => {
    expect(() => service.verify(makeBundle(), new Map())).toThrow(/missing/);
  });

  it("rejects an unknown publisher key rather than warning", () => {
    const bundle = makeBundle();
    const foreign = {
      ...bundle,
      signature: { ...bundle.signature, keyId: "not-registered" },
    };
    expect(() => service.verify(foreign, contents)).toThrow(/unknown key/);
  });

  it("rejects a revoked key", () => {
    const bundle = makeBundle();
    service.revokeKey(keyId);
    expect(() => service.verify(bundle, contents)).toThrow(/revoked key/);
    // restore for any later test ordering
    service.registerKey({
      keyId,
      publisher: "Acme Ltd",
      publicKey: (
        service as unknown as { keys: Map<string, { publicKey: string }> }
      ).keys.get(keyId)!.publicKey,
      revoked: false,
    });
  });

  it("rejects a signature made by a different key", () => {
    const { privateKey } = generateKeyPairSync("ed25519");
    const otherDer = privateKey.export({
      format: "der",
      type: "pkcs8",
    }) as Buffer;
    const bundle = {
      manifest,
      files,
      signature: ExtensionSignatureService.sign({
        manifest,
        files,
        privateKeyDer: otherDer,
        keyId, // claims to be Acme's key
      }),
    };
    expect(() => service.verify(bundle, contents)).toThrow(
      /signature is invalid/,
    );
  });

  it("produces a stable digest regardless of key order or whitespace", () => {
    const reordered = {
      version: "1.0.0",
      publisher: "Acme Ltd",
      scopes: ["log:write"],
      name: "Acme Widget",
      entryPoint: "index.js",
      id: "acme-widget",
    };
    const bundle = makeBundle();
    // Same content, different key order — must still verify.
    expect(() =>
      service.verify({ ...bundle, manifest: reordered }, contents),
    ).not.toThrow();
  });
});
