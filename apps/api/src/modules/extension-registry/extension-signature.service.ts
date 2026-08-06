import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import {
  createHash,
  createPublicKey,
  createPrivateKey,
  sign,
  verify,
} from "node:crypto";
import {
  SignedBundleSchema,
  bundleDigestInput,
  BUNDLE_SIGNATURE_ALGORITHM,
  type BundleFile,
  type PublisherKey,
  type SignedBundle,
} from "@unerp/extension-api";

/**
 * Verifies signed extension bundles — § 8.2, § 10.
 *
 * The sandbox isolates whatever code it is given. This service is what decides
 * whether the code it is given is the code the publisher actually wrote: it
 * fails closed on an unknown key, a revoked key, a tampered manifest, a
 * tampered file, an added file, or a removed one.
 *
 * Note the ordering it enforces — signature first, install second. Verifying
 * after provisioning tables or granting scopes would mean a tampered manifest
 * had already been acted on by the time it was rejected.
 */
@Injectable()
export class ExtensionSignatureService {
  private readonly logger = new Logger(ExtensionSignatureService.name);
  private readonly keys = new Map<string, PublisherKey>();

  /** Register a publisher's verification key. Revoked keys stay registered so a revocation is enforceable rather than a deletion. */
  registerKey(key: PublisherKey): void {
    this.keys.set(key.keyId, key);
  }

  revokeKey(keyId: string): void {
    const existing = this.keys.get(keyId);
    if (existing) this.keys.set(keyId, { ...existing, revoked: true });
  }

  /** SHA-256 of a file's bytes, as recorded in the bundle's file list. */
  static hashFile(content: string | Buffer): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Verify a bundle end to end.
   *
   * `files` maps each declared path to its actual bytes, so the recorded hashes
   * are checked against reality rather than trusted — a signature over a file
   * list proves nothing if nobody confirms the files match the list.
   */
  verify(
    bundle: unknown,
    files: ReadonlyMap<string, string | Buffer>,
  ): SignedBundle {
    const parsed = SignedBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new ForbiddenException(
        `Malformed extension bundle: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    const signed = parsed.data;

    if (signed.signature.algorithm !== BUNDLE_SIGNATURE_ALGORITHM) {
      throw new ForbiddenException(
        `Unsupported signature algorithm "${signed.signature.algorithm}".`,
      );
    }

    const key = this.keys.get(signed.signature.keyId);
    if (!key) {
      throw new ForbiddenException(
        `Bundle is signed with unknown key "${signed.signature.keyId}". An unrecognised ` +
          `publisher key is a rejection, never a warning.`,
      );
    }
    if (key.revoked) {
      throw new ForbiddenException(
        `Bundle is signed with revoked key "${signed.signature.keyId}".`,
      );
    }

    // Every declared file must be present and hash to its recorded digest, and
    // no extra file may be supplied — both directions matter.
    for (const file of signed.files) {
      const content = files.get(file.path);
      if (content === undefined) {
        throw new ForbiddenException(
          `Bundle declares "${file.path}" but it is missing.`,
        );
      }
      const actual = ExtensionSignatureService.hashFile(content);
      if (actual !== file.sha256) {
        throw new ForbiddenException(
          `File "${file.path}" does not match its signed hash — the bundle was modified after signing.`,
        );
      }
    }
    const declared = new Set(signed.files.map((f) => f.path));
    for (const path of files.keys()) {
      if (!declared.has(path)) {
        throw new ForbiddenException(
          `Bundle contains "${path}", which is not in the signed file list.`,
        );
      }
    }

    const digest = bundleDigestInput({
      manifest: signed.manifest,
      files: signed.files,
    });
    const ok = verify(
      null,
      Buffer.from(digest, "utf8"),
      createPublicKey({
        key: Buffer.from(key.publicKey, "base64"),
        format: "der",
        type: "spki",
      }),
      Buffer.from(signed.signature.signature, "base64"),
    );

    if (!ok) {
      throw new ForbiddenException(
        `Bundle signature is invalid — the manifest or file list was modified after signing.`,
      );
    }

    this.logger.log(
      `Verified bundle signed by ${key.publisher} with key ${key.keyId} (${signed.files.length} file(s))`,
    );
    return signed;
  }

  /**
   * Sign a bundle. Used by `unierp app publish` and by the first-party build,
   * and by tests to produce a genuinely valid signature rather than a stub.
   */
  static sign(params: {
    manifest: unknown;
    files: readonly BundleFile[];
    privateKeyDer: Buffer;
    keyId: string;
  }): SignedBundle["signature"] {
    const digest = bundleDigestInput({
      manifest: params.manifest,
      files: params.files,
    });
    const signature = sign(
      null,
      Buffer.from(digest, "utf8"),
      createPrivateKey({
        key: params.privateKeyDer,
        format: "der",
        type: "pkcs8",
      }),
    );
    return {
      algorithm: BUNDLE_SIGNATURE_ALGORITHM,
      keyId: params.keyId,
      signature: signature.toString("base64"),
      signedAt: new Date().toISOString(),
    };
  }
}
