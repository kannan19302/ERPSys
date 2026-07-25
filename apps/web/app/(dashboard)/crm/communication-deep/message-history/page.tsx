"use client";
import { useState, useEffect } from "react";

export default function MessageHistoryPage() {
  const [entityType, setEntityType] = useState("CUSTOMER");
  const [entityId, setEntityId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const search = async () => {
    if (!entityId) return;
    const r = await fetch(
      `/api/crm/communication-deep/message-history?entityType=${entityType}&entityId=${entityId}`,
    );
    const d = await r.json();
    setMessages(d.data || []);
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Message History</h1>
      <div className="flex gap-3 mb-6 items-end">
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity Type</label>
          <select
            className="ui-input"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="LEAD">Lead</option>
            <option value="CONTACT">Contact</option>
            <option value="OPPORTUNITY">Opportunity</option>
          </select>
        </div>
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity ID</label>
          <input
            className="ui-input"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="e.g. cust-123"
          />
        </div>
        <button className="ui-btn" onClick={search}>
          Search
        </button>
      </div>
      {loaded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3 font-medium">Date</th>
                <th className="py-2 px-3 font-medium">Channel</th>
                <th className="py-2 px-3 font-medium">Recipient</th>
                <th className="py-2 px-3 font-medium">Subject</th>
                <th className="py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m: any) => (
                <tr key={m.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">
                    {new Date(m.sentAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3">
                    {m.channel?.name || m.channelId}
                  </td>
                  <td className="py-2 px-3">{m.recipient}</td>
                  <td className="py-2 px-3 max-w-xs truncate">
                    {m.subject || "-"}
                  </td>
                  <td className="py-2 px-3">{m.status}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No messages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
