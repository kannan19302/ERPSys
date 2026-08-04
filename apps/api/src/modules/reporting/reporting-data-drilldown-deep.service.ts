import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ReportingDataDrilldownDeepService {
  async getDrilldownPaths(tenantId: string) {
    return [
      {
        id: "dd-1",
        tenantId,
        sourceDimension: "REGION",
        targetDimension: "COUNTRY",
        drilldownLevel: 1,
        isEnabled: true,
      },
      {
        id: "dd-2",
        tenantId,
        sourceDimension: "PRODUCT_CATEGORY",
        targetDimension: "SKU",
        drilldownLevel: 2,
        isEnabled: true,
      },
    ];
  }

  async executeDrilldown(
    tenantId: string,
    dto: { dimension: string; filterValue: string; metricKey: string },
  ) {
    return {
      dimension: dto.dimension,
      filterValue: dto.filterValue,
      metricKey: dto.metricKey,
      results: [
        { label: "EMEA", value: 428500, growth: "+12.4%" },
        { label: "APAC", value: 312700, growth: "+8.1%" },
        { label: "Americas", value: 615200, growth: "+19.7%" },
      ],
      executedAt: new Date().toISOString(),
    };
  }
}
