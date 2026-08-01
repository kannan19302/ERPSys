import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class DemoDataService {
  /**
   * Seeds demo data (customers, vendors, products) customized by tenant industry.
   */
  async seedDemoData(
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (tenant.demoDataLoaded) {
      throw new BadRequestException(
        "Demo data has already been loaded for this workspace.",
      );
    }

    const org = await prisma.organization.findFirst({
      where: { tenantId },
    });

    if (!org) {
      throw new BadRequestException(
        "No active organization found to bind sample data.",
      );
    }

    const tenantSettings = (tenant.settings as Record<string, any>) || {};
    const industry = (tenantSettings.industry || "generic").toLowerCase();

    // Define mock products by industry
    const getMockProducts = (ind: string) => {
      switch (ind) {
        case "healthcare":
          return [
            {
              sku: "HC-MRI-01",
              name: "MRI Contrast Fluid (Pack of 10)",
              description: "High-contrast solution for MRI diagnostics",
              type: "CONSUMABLE",
              unit: "BOX",
              cost: 120.0,
              sell: 250.0,
            },
            {
              sku: "HC-SYR-02",
              name: "Disposable Syringes (Box of 500)",
              description: "Sterile 3ml medical disposable syringes",
              type: "CONSUMABLE",
              unit: "BOX",
              cost: 15.0,
              sell: 45.0,
            },
            {
              sku: "HC-MSK-03",
              name: "N95 Surgical Masks (Box of 50)",
              description: "Premium particulate filtration surgical masks",
              type: "CONSUMABLE",
              unit: "BOX",
              cost: 8.5,
              sell: 29.99,
            },
          ];
        case "education":
          return [
            {
              sku: "ED-TXT-01",
              name: "Advanced Physics Textbook",
              description: "Comprehensive college-level curriculum textbook",
              type: "STOCK",
              unit: "PCS",
              cost: 45.0,
              sell: 85.0,
            },
            {
              sku: "ED-PRJ-02",
              name: "Smart Classroom Projector",
              description:
                "4K ultra-short-throw classroom interactive projector",
              type: "STOCK",
              unit: "PCS",
              cost: 350.0,
              sell: 699.0,
            },
            {
              sku: "ED-DSK-03",
              name: "Ergonomic Study Desk",
              description: "Height-adjustable students workspace study desk",
              type: "STOCK",
              unit: "PCS",
              cost: 65.0,
              sell: 120.0,
            },
          ];
        case "real-estate":
          return [
            {
              sku: "RE-OFC-01",
              name: "Office Space Suite 404",
              description: "Leasable premium corporate business suite",
              type: "SERVICE",
              unit: "MONTH",
              cost: 1200.0,
              sell: 2500.0,
            },
            {
              sku: "RE-CND-02",
              name: "Residential Condominium Unit B",
              description: "Two-bedroom residential luxury condominium",
              type: "STOCK",
              unit: "PCS",
              cost: 150000.0,
              sell: 280000.0,
            },
            {
              sku: "RE-SHW-03",
              name: "Commercial Flat Ground",
              description: "High foot-traffic street-level commercial showroom",
              type: "SERVICE",
              unit: "MONTH",
              cost: 2000.0,
              sell: 4200.0,
            },
          ];
        case "manufacturing":
          return [
            {
              sku: "MF-MTR-01",
              name: "Industrial Servo Motor",
              description:
                "High-precision rotary actuator for automation systems",
              type: "STOCK",
              unit: "PCS",
              cost: 180.0,
              sell: 399.0,
            },
            {
              sku: "MF-VLV-02",
              name: "Pneumatic Control Valve",
              description: "Solenoid-actuated directional control air valve",
              type: "STOCK",
              unit: "PCS",
              cost: 45.0,
              sell: 95.0,
            },
            {
              sku: "MF-BAR-03",
              name: "Reinforced Steel Framing Bar",
              description: "High-tensile structural carbon steel support bar",
              type: "STOCK",
              unit: "PCS",
              cost: 12.0,
              sell: 28.5,
            },
          ];
        case "services":
        default:
          return [
            {
              sku: "SV-CLD-01",
              name: "Cloud Infrastructure Setup",
              description:
                "Production-grade cloud container platform bootstrap",
              type: "SERVICE",
              unit: "HOURS",
              cost: 50.0,
              sell: 150.0,
            },
            {
              sku: "SV-SEC-02",
              name: "IT Security Audit & Report",
              description:
                "Vulnerability analysis and compliance verification pass",
              type: "SERVICE",
              unit: "PCS",
              cost: 1200.0,
              sell: 3500.0,
            },
            {
              sku: "SV-SUP-03",
              name: "Monthly Enterprise IT Support Ticket",
              description: "Priority 24/7 technical hotline access credits",
              type: "SERVICE",
              unit: "MONTH",
              cost: 200.0,
              sell: 500.0,
            },
          ];
      }
    };

    const mockProducts = getMockProducts(industry);

    // Run within a transaction and enforce RLS context
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;

      // 1. Seed sample customers
      await tx.customer.create({
        data: {
          tenantId,
          orgId: org.id,
          name: "Acme Industrial Labs",
          type: "COMPANY",
          email: "procurement@acme-labs.com",
          phone: "+1-555-0199",
          customerType: "RECURRING",
          riskRating: "LOW",
          paymentTerms: 30,
          notes: "Key enterprise customer seeded on signup.",
        },
      });

      await tx.customer.create({
        data: {
          tenantId,
          orgId: org.id,
          name: "Apex Global Trading",
          type: "COMPANY",
          email: "orders@apexglobal.net",
          phone: "+1-555-0244",
          customerType: "RECURRING",
          riskRating: "LOW",
          paymentTerms: 15,
          notes: "Regular retail supplier partner.",
        },
      });

      // 2. Seed sample vendors
      await tx.vendor.create({
        data: {
          tenantId,
          orgId: org.id,
          name: "Global Tech Solutions Ltd",
          email: "sales@globaltech-sol.com",
          phone: "+44-20-7946-0958",
          type: "COMPANY",
          paymentTerms: 30,
          notes: "Seeded IT and component vendor.",
        },
      });

      await tx.vendor.create({
        data: {
          tenantId,
          orgId: org.id,
          name: "Vanguard Logistics Corp",
          email: "dispatch@vanguard-logistics.com",
          phone: "+1-800-555-0145",
          type: "COMPANY",
          paymentTerms: 30,
          notes: "Fulfillment and shipping logistics supplier.",
        },
      });

      // 3. Seed sample products
      for (const prod of mockProducts) {
        await tx.product.create({
          data: {
            tenantId,
            orgId: org.id,
            sku: prod.sku,
            name: prod.name,
            description: prod.description,
            type: prod.type as any,
            unit: prod.unit,
            costPrice: new Prisma.Decimal(prod.cost),
            sellPrice: new Prisma.Decimal(prod.sell),
          },
        });
      }

      // 4. Update tenant demo loaded flag
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          demoDataLoaded: true,
          demoLoadedAt: new Date(),
        },
      });
    });

    return {
      success: true,
      message: `Demo data for the '${industry}' profile successfully populated with sample products, customers, and vendors.`,
    };
  }
}
