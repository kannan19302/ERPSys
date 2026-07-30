import { defineModule, defineResource } from "@unerp/framework";

export const outboxEntity1Resource = defineResource({
  name: "outbox-entity-1",
  labelSingular: "OutboxEntity1",
  labelPlural: "OutboxEntity1s",
  endpoint: "/outbox/outbox-entity-1",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity2Resource = defineResource({
  name: "outbox-entity-2",
  labelSingular: "OutboxEntity2",
  labelPlural: "OutboxEntity2s",
  endpoint: "/outbox/outbox-entity-2",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity3Resource = defineResource({
  name: "outbox-entity-3",
  labelSingular: "OutboxEntity3",
  labelPlural: "OutboxEntity3s",
  endpoint: "/outbox/outbox-entity-3",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity4Resource = defineResource({
  name: "outbox-entity-4",
  labelSingular: "OutboxEntity4",
  labelPlural: "OutboxEntity4s",
  endpoint: "/outbox/outbox-entity-4",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity5Resource = defineResource({
  name: "outbox-entity-5",
  labelSingular: "OutboxEntity5",
  labelPlural: "OutboxEntity5s",
  endpoint: "/outbox/outbox-entity-5",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity6Resource = defineResource({
  name: "outbox-entity-6",
  labelSingular: "OutboxEntity6",
  labelPlural: "OutboxEntity6s",
  endpoint: "/outbox/outbox-entity-6",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity7Resource = defineResource({
  name: "outbox-entity-7",
  labelSingular: "OutboxEntity7",
  labelPlural: "OutboxEntity7s",
  endpoint: "/outbox/outbox-entity-7",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity8Resource = defineResource({
  name: "outbox-entity-8",
  labelSingular: "OutboxEntity8",
  labelPlural: "OutboxEntity8s",
  endpoint: "/outbox/outbox-entity-8",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity9Resource = defineResource({
  name: "outbox-entity-9",
  labelSingular: "OutboxEntity9",
  labelPlural: "OutboxEntity9s",
  endpoint: "/outbox/outbox-entity-9",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity10Resource = defineResource({
  name: "outbox-entity-10",
  labelSingular: "OutboxEntity10",
  labelPlural: "OutboxEntity10s",
  endpoint: "/outbox/outbox-entity-10",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity11Resource = defineResource({
  name: "outbox-entity-11",
  labelSingular: "OutboxEntity11",
  labelPlural: "OutboxEntity11s",
  endpoint: "/outbox/outbox-entity-11",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity12Resource = defineResource({
  name: "outbox-entity-12",
  labelSingular: "OutboxEntity12",
  labelPlural: "OutboxEntity12s",
  endpoint: "/outbox/outbox-entity-12",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity13Resource = defineResource({
  name: "outbox-entity-13",
  labelSingular: "OutboxEntity13",
  labelPlural: "OutboxEntity13s",
  endpoint: "/outbox/outbox-entity-13",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity14Resource = defineResource({
  name: "outbox-entity-14",
  labelSingular: "OutboxEntity14",
  labelPlural: "OutboxEntity14s",
  endpoint: "/outbox/outbox-entity-14",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity15Resource = defineResource({
  name: "outbox-entity-15",
  labelSingular: "OutboxEntity15",
  labelPlural: "OutboxEntity15s",
  endpoint: "/outbox/outbox-entity-15",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity16Resource = defineResource({
  name: "outbox-entity-16",
  labelSingular: "OutboxEntity16",
  labelPlural: "OutboxEntity16s",
  endpoint: "/outbox/outbox-entity-16",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity17Resource = defineResource({
  name: "outbox-entity-17",
  labelSingular: "OutboxEntity17",
  labelPlural: "OutboxEntity17s",
  endpoint: "/outbox/outbox-entity-17",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity18Resource = defineResource({
  name: "outbox-entity-18",
  labelSingular: "OutboxEntity18",
  labelPlural: "OutboxEntity18s",
  endpoint: "/outbox/outbox-entity-18",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity19Resource = defineResource({
  name: "outbox-entity-19",
  labelSingular: "OutboxEntity19",
  labelPlural: "OutboxEntity19s",
  endpoint: "/outbox/outbox-entity-19",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity20Resource = defineResource({
  name: "outbox-entity-20",
  labelSingular: "OutboxEntity20",
  labelPlural: "OutboxEntity20s",
  endpoint: "/outbox/outbox-entity-20",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxEntity21Resource = defineResource({
  name: "outbox-entity-21",
  labelSingular: "OutboxEntity21",
  labelPlural: "OutboxEntity21s",
  endpoint: "/outbox/outbox-entity-21",
  titleField: "name",
  permissions: { read: "outbox.outboxEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const outboxModule = defineModule({
  id: "outbox",
  title: "Outbox",
  basePath: "/outbox",
  permission: "outbox.read",
  resources: [
    outboxEntity1Resource,
    outboxEntity2Resource,
    outboxEntity3Resource,
    outboxEntity4Resource,
    outboxEntity5Resource,
    outboxEntity6Resource,
    outboxEntity7Resource,
    outboxEntity8Resource,
    outboxEntity9Resource,
    outboxEntity10Resource,
    outboxEntity11Resource,
    outboxEntity12Resource,
    outboxEntity13Resource,
    outboxEntity14Resource,
    outboxEntity15Resource,
    outboxEntity16Resource,
    outboxEntity17Resource,
    outboxEntity18Resource,
    outboxEntity19Resource,
    outboxEntity20Resource,
    outboxEntity21Resource,
  ],
});
