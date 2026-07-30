import { defineModule, defineResource } from "@unerp/framework";

export const notificationsEntity1Resource = defineResource({
  name: "notifications-entity-1",
  labelSingular: "NotificationsEntity1",
  labelPlural: "NotificationsEntity1s",
  endpoint: "/notifications/notifications-entity-1",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity2Resource = defineResource({
  name: "notifications-entity-2",
  labelSingular: "NotificationsEntity2",
  labelPlural: "NotificationsEntity2s",
  endpoint: "/notifications/notifications-entity-2",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity3Resource = defineResource({
  name: "notifications-entity-3",
  labelSingular: "NotificationsEntity3",
  labelPlural: "NotificationsEntity3s",
  endpoint: "/notifications/notifications-entity-3",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity4Resource = defineResource({
  name: "notifications-entity-4",
  labelSingular: "NotificationsEntity4",
  labelPlural: "NotificationsEntity4s",
  endpoint: "/notifications/notifications-entity-4",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity5Resource = defineResource({
  name: "notifications-entity-5",
  labelSingular: "NotificationsEntity5",
  labelPlural: "NotificationsEntity5s",
  endpoint: "/notifications/notifications-entity-5",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity6Resource = defineResource({
  name: "notifications-entity-6",
  labelSingular: "NotificationsEntity6",
  labelPlural: "NotificationsEntity6s",
  endpoint: "/notifications/notifications-entity-6",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity7Resource = defineResource({
  name: "notifications-entity-7",
  labelSingular: "NotificationsEntity7",
  labelPlural: "NotificationsEntity7s",
  endpoint: "/notifications/notifications-entity-7",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity8Resource = defineResource({
  name: "notifications-entity-8",
  labelSingular: "NotificationsEntity8",
  labelPlural: "NotificationsEntity8s",
  endpoint: "/notifications/notifications-entity-8",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity9Resource = defineResource({
  name: "notifications-entity-9",
  labelSingular: "NotificationsEntity9",
  labelPlural: "NotificationsEntity9s",
  endpoint: "/notifications/notifications-entity-9",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity10Resource = defineResource({
  name: "notifications-entity-10",
  labelSingular: "NotificationsEntity10",
  labelPlural: "NotificationsEntity10s",
  endpoint: "/notifications/notifications-entity-10",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity11Resource = defineResource({
  name: "notifications-entity-11",
  labelSingular: "NotificationsEntity11",
  labelPlural: "NotificationsEntity11s",
  endpoint: "/notifications/notifications-entity-11",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity12Resource = defineResource({
  name: "notifications-entity-12",
  labelSingular: "NotificationsEntity12",
  labelPlural: "NotificationsEntity12s",
  endpoint: "/notifications/notifications-entity-12",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity13Resource = defineResource({
  name: "notifications-entity-13",
  labelSingular: "NotificationsEntity13",
  labelPlural: "NotificationsEntity13s",
  endpoint: "/notifications/notifications-entity-13",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity14Resource = defineResource({
  name: "notifications-entity-14",
  labelSingular: "NotificationsEntity14",
  labelPlural: "NotificationsEntity14s",
  endpoint: "/notifications/notifications-entity-14",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity15Resource = defineResource({
  name: "notifications-entity-15",
  labelSingular: "NotificationsEntity15",
  labelPlural: "NotificationsEntity15s",
  endpoint: "/notifications/notifications-entity-15",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity16Resource = defineResource({
  name: "notifications-entity-16",
  labelSingular: "NotificationsEntity16",
  labelPlural: "NotificationsEntity16s",
  endpoint: "/notifications/notifications-entity-16",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity17Resource = defineResource({
  name: "notifications-entity-17",
  labelSingular: "NotificationsEntity17",
  labelPlural: "NotificationsEntity17s",
  endpoint: "/notifications/notifications-entity-17",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity18Resource = defineResource({
  name: "notifications-entity-18",
  labelSingular: "NotificationsEntity18",
  labelPlural: "NotificationsEntity18s",
  endpoint: "/notifications/notifications-entity-18",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity19Resource = defineResource({
  name: "notifications-entity-19",
  labelSingular: "NotificationsEntity19",
  labelPlural: "NotificationsEntity19s",
  endpoint: "/notifications/notifications-entity-19",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity20Resource = defineResource({
  name: "notifications-entity-20",
  labelSingular: "NotificationsEntity20",
  labelPlural: "NotificationsEntity20s",
  endpoint: "/notifications/notifications-entity-20",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsEntity21Resource = defineResource({
  name: "notifications-entity-21",
  labelSingular: "NotificationsEntity21",
  labelPlural: "NotificationsEntity21s",
  endpoint: "/notifications/notifications-entity-21",
  titleField: "name",
  permissions: { read: "notifications.notificationsEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const notificationsModule = defineModule({
  id: "notifications",
  title: "Notifications",
  basePath: "/notifications",
  permission: "notifications.read",
  resources: [
    notificationsEntity1Resource,
    notificationsEntity2Resource,
    notificationsEntity3Resource,
    notificationsEntity4Resource,
    notificationsEntity5Resource,
    notificationsEntity6Resource,
    notificationsEntity7Resource,
    notificationsEntity8Resource,
    notificationsEntity9Resource,
    notificationsEntity10Resource,
    notificationsEntity11Resource,
    notificationsEntity12Resource,
    notificationsEntity13Resource,
    notificationsEntity14Resource,
    notificationsEntity15Resource,
    notificationsEntity16Resource,
    notificationsEntity17Resource,
    notificationsEntity18Resource,
    notificationsEntity19Resource,
    notificationsEntity20Resource,
    notificationsEntity21Resource,
  ],
});
