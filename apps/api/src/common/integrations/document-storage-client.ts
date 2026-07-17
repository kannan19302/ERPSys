export interface CreatedDocument {
  id: string;
  versions: Array<{ id: string }>;
}

/** Narrow file-storage capability available to modules outside Drive. */
export abstract class DocumentStorageClient {
  abstract createDocument(
    tenantId: string,
    orgId: string,
    dto: { name: string; folderId?: string; templateId?: string },
    createdBy: string,
    file?: Express.Multer.File,
  ): Promise<CreatedDocument | null>;
}
