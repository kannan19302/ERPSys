import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { verifyToken } from '@unerp/auth';

@WebSocketGateway({
  cors: {
    origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }

    const decoded = verifyToken(token) as { userId?: string; tenantId?: string } | null;
    if (!decoded?.userId) {
      client.disconnect();
      return;
    }

    (client as any).userId = decoded.userId;
    (client as any).tenantId = decoded.tenantId;

    client.join(`tenant:${decoded.tenantId}`);
    client.join(`user:${decoded.userId}`);

    const sockets = this.userSockets.get(decoded.userId) || new Set();
    sockets.add(client.id);
    this.userSockets.set(decoded.userId, sockets);

    this.server.to(`tenant:${decoded.tenantId}`).emit('presence', {
      userId: decoded.userId,
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    const tenantId = (client as any).tenantId;

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          if (tenantId) {
            this.server.to(`tenant:${tenantId}`).emit('presence', {
              userId,
              status: 'OFFLINE',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  @SubscribeMessage('join:channel')
  handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.join(`channel:${data.channelId}`);
  }

  @SubscribeMessage('leave:channel')
  handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.leave(`channel:${data.channelId}`);
  }

  /**
   * Legacy client-originated event: a connected client asks the server to broadcast an ephemeral
   * (non-persisted) chat payload to its room. Kept for backward compatibility, but Connect's
   * actual message-send path does NOT go through this — persisted messages are broadcast via
   * `broadcastChatMessage()` below, called from CommunicationService.createMessage after the
   * message has a real id/timestamp from Postgres. Do not use this handler as the persistence path.
   */
  @SubscribeMessage('chat:message')
  handleChatMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string; content: string }) {
    const userId = (client as any).userId;
    const tenantId = (client as any).tenantId;

    this.server.to(`channel:${data.channelId}`).emit('chat:message', {
      channelId: data.channelId,
      userId,
      tenantId,
      content: data.content,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    const userId = (client as any).userId;
    // Ephemeral only — no persistence. Broadcast to everyone else in the room; the sender's own
    // client already knows it's typing, so `client.to(...)` (not `this.server.to(...)`) is used
    // to exclude the sender, matching Slack/Teams typing-indicator semantics.
    client.to(`channel:${data.channelId}`).emit('typing', { userId, channelId: data.channelId });
  }

  /**
   * Server-initiated broadcast of a persisted Connect message into its channel room.
   * Called from CommunicationService.createMessage (US-A3) after the message is durably
   * written to Postgres, so `payload` carries the real id/createdAt, not an ephemeral guess.
   */
  broadcastChatMessage(channelId: string, payload: Record<string, unknown>) {
    this.server?.to(`channel:${channelId}`).emit('chat:message', payload);
  }

  /**
   * Server-initiated presence broadcast (US-A5), called from CommunicationService.setPresence
   * so other tenant members watching the directory see the change live instead of on their next
   * 15s poll. Distinct from the connect/disconnect ONLINE/OFFLINE emits above, which only reflect
   * socket liveness, not the user's chosen presence status (ACTIVE/AWAY/BRB/DND/OOO).
   */
  broadcastPresenceUpdate(tenantId: string, payload: Record<string, unknown>) {
    this.server?.to(`tenant:${tenantId}`).emit('presence', payload);
  }

  @OnEvent('notification.send')
  handleNotificationEvent(payload: { userId: string; tenantId: string; type: string; title: string; body?: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification', {
      type: payload.type,
      title: payload.title,
      body: payload.body || '',
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('workflow.executed')
  handleWorkflowEvent(payload: { tenantId: string; workflowId: string; entityType: string }) {
    this.server.to(`tenant:${payload.tenantId}`).emit('workflow:completed', payload);
  }

  getOnlineUsers(tenantId: string): string[] {
    const room = this.server?.sockets?.adapter?.rooms?.get(`tenant:${tenantId}`);
    if (!room) return [];

    const userIds = new Set<string>();
    for (const socketId of room) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        const userId = (socket as any).userId;
        if (userId) userIds.add(userId);
      }
    }
    return [...userIds];
  }
}
