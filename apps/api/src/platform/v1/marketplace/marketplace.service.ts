import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class MarketplaceService {
  async listSubmissions() {
    // In Phase 5 we mock the marketplace submissions
    return [
      { id: "ext-1", name: "Advanced CRM", status: "pending_review" },
      { id: "ext-2", name: "Payment Gateway", status: "pending_review" },
    ];
  }

  async approveExtension(id: string) {
    // Sign the bundle and publish it
    return { success: true, message: `Extension ${id} approved and signed` };
  }

  async rejectExtension(id: string, reason: string) {
    return {
      success: true,
      message: `Extension ${id} rejected. Reason: ${reason}`,
    };
  }
}
