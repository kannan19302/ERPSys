import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsGateway } from '../notifications.gateway';

describe('NotificationsGateway — Connect real-time wiring (US-A3/US-A4/US-A5)', () => {
  let gateway: NotificationsGateway;
  let emit: ReturnType<typeof vi.fn>;
  let to: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gateway = new NotificationsGateway();
    emit = vi.fn();
    to = vi.fn().mockReturnValue({ emit });
    // @ts-expect-error - server is normally injected by @WebSocketServer(); stub it for unit testing.
    gateway.server = { to };
  });

  it('broadcastChatMessage emits into the correct channel room', () => {
    gateway.broadcastChatMessage('chan-1', { id: 'm1', content: 'hi' });

    expect(to).toHaveBeenCalledWith('channel:chan-1');
    expect(emit).toHaveBeenCalledWith('chat:message', { id: 'm1', content: 'hi' });
  });

  it('broadcastPresenceUpdate emits into the correct tenant room', () => {
    gateway.broadcastPresenceUpdate('tenant-1', { userId: 'u1', presence: 'DND' });

    expect(to).toHaveBeenCalledWith('tenant:tenant-1');
    expect(emit).toHaveBeenCalledWith('presence', { userId: 'u1', presence: 'DND' });
  });

  it('broadcastChatMessage does not throw when server is not yet initialized (defensive optional chaining)', () => {
    // @ts-expect-error - simulate server not yet attached.
    gateway.server = undefined;
    expect(() => gateway.broadcastChatMessage('chan-1', {})).not.toThrow();
  });

  it('typing handler broadcasts to other room members but excludes the sender (client.to, not server.to)', () => {
    const clientEmit = vi.fn();
    const clientTo = vi.fn().mockReturnValue({ emit: clientEmit });
    const client = { to: clientTo, userId: 'u1' } as unknown as Parameters<NotificationsGateway['handleTyping']>[0];

    gateway.handleTyping(client, { channelId: 'chan-1' });

    expect(clientTo).toHaveBeenCalledWith('channel:chan-1');
    expect(clientEmit).toHaveBeenCalledWith('typing', { userId: 'u1', channelId: 'chan-1' });
    // Ensure it did NOT use server.to (which would also echo back to the sender).
    expect(to).not.toHaveBeenCalledWith('channel:chan-1');
  });
});
