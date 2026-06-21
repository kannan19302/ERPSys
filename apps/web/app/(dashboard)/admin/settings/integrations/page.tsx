'use client';

import React from 'react';
import { Plug, Shield } from 'lucide-react';

export default function IntegrationsSettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground text-sm">Connect your workspace to external payment gateways, mail servers, and endpoints.</p>
      </div>

      <div className="frappe-card p-6 md:p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Plug size={18} className="text-primary"/> External Connections</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage SMTP bindings, billing connectors, and webhooks.</p>
        </div>
        <hr className="border-border" />

        <div className="flex flex-col gap-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
              <div className="font-medium text-sm flex items-center gap-2"><Shield size={16} className="text-primary"/> SMTP / Email Gateway</div>
              <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3">Configure</button>
            </div>
            <div className="p-4 text-xs text-muted-foreground">
              Configure your own SMTP server to send invoices, quotes, and password resets from your own domain.
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
              <div className="font-medium text-sm flex items-center gap-2">Stripe Payments</div>
              <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3">Connect</button>
            </div>
            <div className="p-4 text-xs text-muted-foreground">
              Allow customers to pay invoices online via credit card.
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
              <div className="font-medium text-sm flex items-center gap-2">Webhook Endpoint</div>
              <button className="frappe-btn frappe-btn-primary text-xs py-1 px-3">Add Webhook</button>
            </div>
            <div className="p-4 text-xs text-muted-foreground">
              Receive real-time HTTP POST payloads when events happen in your workspace (e.g. Invoice Created).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
