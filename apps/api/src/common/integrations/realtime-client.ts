/** Narrow real-time publication capability available to feature modules. */
export abstract class RealtimeClient {
  abstract broadcastChatMessage(channelId: string, payload: Record<string, unknown>): void;

  abstract broadcastPresenceUpdate(tenantId: string, payload: Record<string, unknown>): void;
}
