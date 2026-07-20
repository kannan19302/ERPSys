import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { verifyToken } from "@unerp/auth";
import { RealtimeClient } from "../../common/integrations/realtime-client";

@WebSocketGateway({ namespace: "/saas", cors: { origin: "*" } })
export class SaasGateway
  extends RealtimeClient
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SaasGateway.name);

  @WebSocketServer()
  server!: Server;

  private tenantSockets = new Map<string, Set<string>>();

  private rateLimitMap = new Map<string, number[]>();

  private readonly RATE_LIMIT_MAX = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 1000;

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      client.disconnect();
      return;
    }

    const decoded = verifyToken(token) as {
      userId?: string;
      tenantId?: string;
    } | null;
    if (!decoded?.tenantId) {
      client.disconnect();
      return;
    }

    (client as any).userId = decoded.userId;
    (client as any).tenantId = decoded.tenantId;

    client.join(`tenant:${decoded.tenantId}`);

    const sockets = this.tenantSockets.get(decoded.tenantId) || new Set();
    sockets.add(client.id);
    this.tenantSockets.set(decoded.tenantId, sockets);

    this.logger.log(
      `Client ${client.id} connected to tenant ${decoded.tenantId}`,
    );
  }

  handleDisconnect(client: Socket) {
    const tenantId = (client as any).tenantId;

    if (tenantId) {
      const sockets = this.tenantSockets.get(tenantId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.tenantSockets.delete(tenantId);
        }
      }
    }

    this.rateLimitMap.delete(client.id);

    this.logger.log(`Client ${client.id} disconnected`);
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(clientId) || [];
    const windowStart = now - this.RATE_LIMIT_WINDOW_MS;
    const recent = timestamps.filter((t) => t > windowStart);
    if (recent.length >= this.RATE_LIMIT_MAX) {
      return false;
    }
    recent.push(now);
    this.rateLimitMap.set(clientId, recent);
    return true;
  }

  @SubscribeMessage("ping")
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit("pong", { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage("subscribe:usage")
  handleSubscribeUsage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { metrics?: string[] },
  ) {
    if (!this.checkRateLimit(client.id)) return;
    const tenantId = (client as any).tenantId;
    if (data?.metrics) {
      for (const metric of data.metrics) {
        client.join(`usage:${tenantId}:${metric}`);
      }
    } else {
      client.join(`usage:${tenantId}`);
    }
  }

  @SubscribeMessage("subscribe:billing")
  handleSubscribeBilling(@ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client.id)) return;
    const tenantId = (client as any).tenantId;
    client.join(`billing:${tenantId}`);
  }

  @SubscribeMessage("subscribe:alerts")
  handleSubscribeAlerts(@ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client.id)) return;
    const tenantId = (client as any).tenantId;
    client.join(`alerts:${tenantId}`);
  }

  @SubscribeMessage("subscribe:activity")
  handleSubscribeActivity(@ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client.id)) return;
    const tenantId = (client as any).tenantId;
    client.join(`activity:${tenantId}`);
  }

  emitToTenant(tenantId: string, event: string, data: any) {
    this.server?.to(`tenant:${tenantId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.server?.emit(event, data);
  }

  emitUsageUpdate(tenantId: string, data: { metric: string; current: number; limit: number; pct: number }) {
    this.server?.to(`tenant:${tenantId}`).emit("usage:update", data);
    this.server?.to(`usage:${tenantId}:${data.metric}`).emit("usage:update", data);
  }

  emitBillingInvoice(tenantId: string, data: { invoiceId: string; amount: number; currency: string; dueDate: string; status: string }) {
    this.server?.to(`billing:${tenantId}`).emit("billing:invoice", data);
  }

  emitBillingPayment(tenantId: string, data: { paymentId: string; invoiceId: string; amount: number; status: string; method: string }) {
    this.server?.to(`billing:${tenantId}`).emit("billing:payment", data);
  }

  emitAlert(tenantId: string, data: { alertId: string; type: string; severity: string; message: string; metric?: string; currentValue?: number; threshold?: number }) {
    this.server?.to(`alerts:${tenantId}`).emit("alert:triggered", data);
  }

  emitActivity(tenantId: string, data: { userId: string; userName: string; action: string; resource: string; details?: string; timestamp: string }) {
    this.server?.to(`activity:${tenantId}`).emit("activity:team", data);
  }

  emitSubscriptionChange(tenantId: string, data: { planId: string; planName: string; status: string; previousPlan?: string; effectiveDate: string }) {
    this.server?.to(`tenant:${tenantId}`).emit("subscription:changed", data);
  }

  emitAnnouncement(data: { id: string; title: string; body: string; priority: string; publishedAt: string }) {
    this.server?.emit("announcement:new", data);
  }

  broadcastChatMessage(_channelId: string, _payload: Record<string, unknown>) {
    this.logger.warn("broadcastChatMessage not implemented in SaasGateway");
  }

  broadcastPresenceUpdate(_tenantId: string, _payload: Record<string, unknown>) {
    this.logger.warn("broadcastPresenceUpdate not implemented in SaasGateway");
  }
}
