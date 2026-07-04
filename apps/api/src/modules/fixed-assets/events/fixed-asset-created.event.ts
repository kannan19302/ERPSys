export class FixedAssetCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly assetId: string,
    public readonly assetCode: string,
    public readonly name: string,
    public readonly purchaseValue: number,
    public readonly purchaseDate: Date
  ) {}
}
