"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Button,
  Badge,
  ProtectedComponent,
} from "@unerp/ui";
import {
  Plus,
  Edit3,
  Trash2,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../_components/api";

interface Channel {
  id: string;
  name: string;
  channelType: string;
  provider?: string;
  isActive: boolean;
}
interface Template {
  id: string;
  name: string;
  channelId: string;
  subject?: string;
  body: string;
  category: string;
  isActive: boolean;
  channel?: { id: string; name: string; channelType: string };
}
interface ChannelStats {
  channels: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="w-4 h-4" />,
  SMS: <MessageSquare className="w-4 h-4" />,
  WHATSAPP: <Smartphone className="w-4 h-4" />,
  CHAT: <Globe className="w-4 h-4" />,
  PUSH: <Send className="w-4 h-4" />,
};

export default function CommunicationTemplatesPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: "",
    channelType: "EMAIL",
    provider: "",
  });
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [channelsData, templatesData, statsData] = await Promise.all([
        apiGet<Channel[]>("/crm/communication/channels"),
        apiGet<Template[]>("/crm/communication/templates"),
        apiGet<ChannelStats>("/crm/communication/stats"),
      ]);
      setChannels(Array.isArray(channelsData) ? channelsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setStats(statsData as ChannelStats);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createChannel = async () => {
    await apiSend("/crm/communication/channels", "POST", channelForm);
    setShowChannelForm(false);
    setChannelForm({ name: "", channelType: "EMAIL", provider: "" });
    load();
  };

  const deleteChannel = async (id: string) => {
    if (
      confirm(
        "Delete this channel? This cannot be undone if it has no templates.",
      )
    ) {
      await apiSend(`/crm/communication/channels/${id}`, "DELETE");
      load();
    }
  };

  const filteredTemplates = selectedChannel
    ? templates.filter((t) => t.channelId === selectedChannel)
    : templates;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication Templates"
        description="Manage multi-channel communication templates and channels"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowChannelForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Channel
          </Button>
        }
      />

      {stats && (
        <div className="ui-grid-4">
          <Card>
            <div className="text-2xl font-bold">{stats.channels}</div>
            <div className="text-sm text-gray-500">Channels</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <div className="text-sm text-gray-500">Total Sent</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDelivered}
            </div>
            <div className="text-sm text-gray-500">Delivered</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalFailed}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </Card>
        </div>
      )}

      <div className="ui-grid-2">
        <Card title="Channels">
          {showChannelForm && (
            <div className="mb-4 p-3 border rounded bg-gray-50">
              <input
                className="input-style mb-2"
                value={channelForm.name}
                onChange={(e) =>
                  setChannelForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Channel name"
              />
              <select
                className="input-style mb-2"
                value={channelForm.channelType}
                onChange={(e) =>
                  setChannelForm((p) => ({ ...p, channelType: e.target.value }))
                }
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CHAT">Chat</option>
                <option value="PUSH">Push</option>
              </select>
              <input
                className="input-style mb-2"
                value={channelForm.provider}
                onChange={(e) =>
                  setChannelForm((p) => ({ ...p, provider: e.target.value }))
                }
                placeholder="Provider (e.g. Twilio)"
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={createChannel}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowChannelForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <ul className="space-y-1">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${selectedChannel === ch.id ? "bg-blue-50" : ""}`}
                onClick={() =>
                  setSelectedChannel(selectedChannel === ch.id ? "" : ch.id)
                }
              >
                <span>
                  {CHANNEL_ICONS[ch.channelType]}{" "}
                  <span className="ml-2">{ch.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {ch.channelType}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ch.isActive ? "success" : "warning"}
                    size="sm"
                  >
                    {ch.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <ProtectedComponent permission="crm.communication.manage">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChannel(ch.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </ProtectedComponent>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={
            selectedChannel
              ? `Templates (${channels.find((c) => c.id === selectedChannel)?.name})`
              : "All Templates"
          }
        >
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-gray-400">No templates</p>
          ) : (
            <ul className="space-y-2">
              {filteredTemplates.map((t) => (
                <li key={t.id} className="p-2 border rounded hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.name}</span>
                    <Badge
                      variant={t.isActive ? "success" : "warning"}
                      size="sm"
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t.channel && (
                      <span className="mr-3">
                        {CHANNEL_ICONS[t.channel.channelType]} {t.channel.name}
                      </span>
                    )}
                    <Badge variant="default" size="sm">
                      {t.category}
                    </Badge>
                    {t.subject && (
                      <span className="ml-3">Subject: {t.subject}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
