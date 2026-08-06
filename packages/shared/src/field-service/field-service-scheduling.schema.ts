import { z } from "zod";

export const scheduleSchema = z.object({
  technicianId: z.string().min(1),
  ticketId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().datetime(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  durationMin: z.number().int().min(15).default(60),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.string().default("SCHEDULED"),
  notes: z.string().optional().nullable(),
});

export const scheduleUpdateSchema = scheduleSchema.partial();

export const calendarEventSchema = z.object({
  technicianId: z.string().min(1),
  scheduleId: z.string().optional().nullable(),
  ticketId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  eventType: z
    .enum(["APPOINTMENT", "BREAK", "TRAVEL", "MEETING", "PERSONAL", "OTHER"])
    .default("APPOINTMENT"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  color: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.string().default("ACTIVE"),
});

export const calendarEventUpdateSchema = calendarEventSchema.partial();

export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type CalendarEventDto = z.infer<typeof calendarEventSchema>;
