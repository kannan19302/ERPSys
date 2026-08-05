import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { prisma } from "@unerp/database";
import { bundleDigestInput } from "@unerp/extension-api";
import { VendorService } from "../vendor.service";
import { BundleStoreService } from "../bundle-store.service";

/**
 * § 8.2 / § 10 — approving a bundle makes it installable by every tenant on the
 * platform, so publication is the last point at which authorship can be
 * established. These tests are the publish gate, each one a way an unsigned or
 * mis-signed bundle might otherwise reach tenants.
 */
describe("VendorService — bundle signing gate", () => {
  const service = new VendorService(new BundleStoreService());

  let vendorId: string;
  let otherVendorId: string;
  let packageId: string;
  let privateKeyDer: Buffer;
  const keyId = `spec-key-${Date.now()}`;
  const otherKeyId = `spec-other-${Date.now()}`;

  const manifest = {
    slug: "",
    name: "Spec App",
    version: "1.0.0",
    vendor: "",
    category: "productivity",
  };

  const files = [{ path: "index.js", sha256: "a".repeat(64), bytes: 10 }];

  const signWith = (der: Buffer, m: unknown) =>
    sign(null, Buffer.from(bundleDigestInput({ manifest: m, files }), "utf8"), {
      key: der,
      format: "der",
      type: "pkcs8",
    }).toString("base64");

  beforeAll(async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    privateKeyDer = privateKey.export({
      format: "der",
      type: "pkcs8",
    }) as Buffer;

    const vendor = await prisma.appVendor.create({
      data: {
        name: `Spec Vendor ${Date.now()}`,
        slug: `spec-vendor-${Date.now()}`,
      },
    });
    vendorId = vendor.id;
    const other = await prisma.appVendor.create({
      data: {
        name: `Other Vendor ${Date.now()}`,
        slug: `other-vendor-${Date.now()}`,
      },
    });
    otherVendorId = other.id;

    await prisma.appVendorSigningKey.create({
      data: {
        vendorId,
        keyId,
        publicKey: (
          publicKey.export({ format: "der", type: "spki" }) as Buffer
        ).toString("base64"),
      },
    });
    const otherPair = generateKeyPairSync("ed25519");
    await prisma.appVendorSigningKey.create({
      data: {
        vendorId: otherVendorId,
        keyId: otherKeyId,
        publicKey: (
          otherPair.publicKey.export({ format: "der", type: "spki" }) as Buffer
        ).toString("base64"),
      },
    });

    const pkg = await prisma.appPackage.create({
      data: {
        vendorId,
        slug: `spec-app-${Date.now()}`,
        name: "Spec App",
        category: "productivity",
        status: "DRAFT",
      },
    });
    packageId = pkg.id;
    manifest.slug = pkg.slug;
    manifest.vendor = vendor.slug;
  });

  afterAll(async () => {
    await prisma.appBundle.deleteMany({ where: { packageId } });
    await prisma.appPackage.deleteMany({ where: { id: packageId } });
    await prisma.appVendorSigningKey.deleteMany({
      where: { keyId: { in: [keyId, otherKeyId] } },
    });
    await prisma.appVendor.deleteMany({
      where: { id: { in: [vendorId, otherVendorId] } },
    });
  });

  const makeBundle = (over: Record<string, unknown> = {}) =>
    prisma.appBundle.create({
      data: {
        packageId,
        version: `1.0.${Math.floor(Math.random() * 1e6)}`,
        manifest: manifest as object,
        blobKey: "spec/blob",
        status: "IN_REVIEW",
        ...over,
      },
    });

  it("refuses to publish an unsigned bundle", async () => {
    const bundle = await makeBundle();
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/unsigned and cannot be published/);
  });

  it("refuses a signature from an unregistered key", async () => {
    const bundle = await makeBundle({
      signingKeyId: "never-registered",
      signature: { signature: signWith(privateKeyDer, manifest), files },
    });
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/unregistered key/);
  });

  it("refuses a key that belongs to a different vendor", async () => {
    const bundle = await makeBundle({
      signingKeyId: otherKeyId,
      signature: { signature: signWith(privateKeyDer, manifest), files },
    });
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/different vendor/);
  });

  it("refuses a revoked key", async () => {
    await prisma.appVendorSigningKey.update({
      where: { keyId },
      data: { revoked: true, revokedReason: "compromised in spec" },
    });
    const bundle = await makeBundle({
      signingKeyId: keyId,
      signature: { signature: signWith(privateKeyDer, manifest), files },
    });
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/revoked key/);
    await prisma.appVendorSigningKey.update({
      where: { keyId },
      data: { revoked: false, revokedReason: null },
    });
  });

  it("refuses a bundle whose manifest was altered after signing", async () => {
    // Signature computed over the original manifest, but the stored manifest
    // declares a different version — the reviewed artefact is not the shipped one.
    const bundle = await makeBundle({
      signingKeyId: keyId,
      manifest: { ...manifest, version: "9.9.9" } as object,
      signature: { signature: signWith(privateKeyDer, manifest), files },
    });
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/signature is invalid/);
  });

  it("refuses a signature that covers no file list", async () => {
    const bundle = await makeBundle({
      signingKeyId: keyId,
      signature: { signature: signWith(privateKeyDer, manifest) },
    });
    await expect(
      service.approveBundle(bundle.id, "reviewer-1"),
    ).rejects.toThrow(/does not cover a file list/);
  });
});
