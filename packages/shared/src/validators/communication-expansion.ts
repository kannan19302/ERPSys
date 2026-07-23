import { z } from 'zod';

// ── Chat Rooms ──
export const createChatRoomSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  description: z.string().optional(),
  topic: z.string().optional(),
  isPrivate: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>;

export const updateChatRoomSchema = createChatRoomSchema.partial();
export type UpdateChatRoomInput = z.infer<typeof updateChatRoomSchema>;

// ── Chat Messages ──
export const sendChatMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1),
  contentType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  parentId: z.string().optional(),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const updateChatMessageSchema = z.object({
  content: z.string().min(1),
});
export type UpdateChatMessageInput = z.infer<typeof updateChatMessageSchema>;

// ── Message Reactions ──
export const createMessageReactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1),
});
export type CreateMessageReactionInput = z.infer<typeof createMessageReactionSchema>;

// ── Typing Indicator ──
export const typingIndicatorSchema = z.object({
  roomId: z.string().min(1),
  isTyping: z.boolean(),
});

// ── Video Calls ──
export const createVideoCallRoomSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateVideoCallRoomInput = z.infer<typeof createVideoCallRoomSchema>;

// ── File Shares ──
export const createFileShareSchema = z.object({
  roomId: z.string().optional(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  url: z.string().optional(),
});
export type CreateFileShareInput = z.infer<typeof createFileShareSchema>;

// ── Announcements ──
export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  priority: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  targets: z.array(z.object({
    targetType: z.string(),
    targetId: z.string().optional(),
  })).optional(),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
