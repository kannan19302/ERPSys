export class FixedAssetDepreciatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly assetId: string,
    public readonly amount: number,
    public readonly periodName: string,
    public readonly journalId: string | null
  ) {}
}
