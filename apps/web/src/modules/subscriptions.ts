// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const subscriptionsEntity1Resource = defineResource({
  name: "subscriptions-entity-1",
  labelSingular: "SubscriptionsEntity1",
  labelPlural: "SubscriptionsEntity1s",
  endpoint: "/subscriptions/subscriptions-entity-1",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity2Resource = defineResource({
  name: "subscriptions-entity-2",
  labelSingular: "SubscriptionsEntity2",
  labelPlural: "SubscriptionsEntity2s",
  endpoint: "/subscriptions/subscriptions-entity-2",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity3Resource = defineResource({
  name: "subscriptions-entity-3",
  labelSingular: "SubscriptionsEntity3",
  labelPlural: "SubscriptionsEntity3s",
  endpoint: "/subscriptions/subscriptions-entity-3",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity4Resource = defineResource({
  name: "subscriptions-entity-4",
  labelSingular: "SubscriptionsEntity4",
  labelPlural: "SubscriptionsEntity4s",
  endpoint: "/subscriptions/subscriptions-entity-4",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity5Resource = defineResource({
  name: "subscriptions-entity-5",
  labelSingular: "SubscriptionsEntity5",
  labelPlural: "SubscriptionsEntity5s",
  endpoint: "/subscriptions/subscriptions-entity-5",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity6Resource = defineResource({
  name: "subscriptions-entity-6",
  labelSingular: "SubscriptionsEntity6",
  labelPlural: "SubscriptionsEntity6s",
  endpoint: "/subscriptions/subscriptions-entity-6",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity7Resource = defineResource({
  name: "subscriptions-entity-7",
  labelSingular: "SubscriptionsEntity7",
  labelPlural: "SubscriptionsEntity7s",
  endpoint: "/subscriptions/subscriptions-entity-7",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity8Resource = defineResource({
  name: "subscriptions-entity-8",
  labelSingular: "SubscriptionsEntity8",
  labelPlural: "SubscriptionsEntity8s",
  endpoint: "/subscriptions/subscriptions-entity-8",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity9Resource = defineResource({
  name: "subscriptions-entity-9",
  labelSingular: "SubscriptionsEntity9",
  labelPlural: "SubscriptionsEntity9s",
  endpoint: "/subscriptions/subscriptions-entity-9",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity10Resource = defineResource({
  name: "subscriptions-entity-10",
  labelSingular: "SubscriptionsEntity10",
  labelPlural: "SubscriptionsEntity10s",
  endpoint: "/subscriptions/subscriptions-entity-10",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity11Resource = defineResource({
  name: "subscriptions-entity-11",
  labelSingular: "SubscriptionsEntity11",
  labelPlural: "SubscriptionsEntity11s",
  endpoint: "/subscriptions/subscriptions-entity-11",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity12Resource = defineResource({
  name: "subscriptions-entity-12",
  labelSingular: "SubscriptionsEntity12",
  labelPlural: "SubscriptionsEntity12s",
  endpoint: "/subscriptions/subscriptions-entity-12",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity13Resource = defineResource({
  name: "subscriptions-entity-13",
  labelSingular: "SubscriptionsEntity13",
  labelPlural: "SubscriptionsEntity13s",
  endpoint: "/subscriptions/subscriptions-entity-13",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity14Resource = defineResource({
  name: "subscriptions-entity-14",
  labelSingular: "SubscriptionsEntity14",
  labelPlural: "SubscriptionsEntity14s",
  endpoint: "/subscriptions/subscriptions-entity-14",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity15Resource = defineResource({
  name: "subscriptions-entity-15",
  labelSingular: "SubscriptionsEntity15",
  labelPlural: "SubscriptionsEntity15s",
  endpoint: "/subscriptions/subscriptions-entity-15",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity16Resource = defineResource({
  name: "subscriptions-entity-16",
  labelSingular: "SubscriptionsEntity16",
  labelPlural: "SubscriptionsEntity16s",
  endpoint: "/subscriptions/subscriptions-entity-16",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsEntity17Resource = defineResource({
  name: "subscriptions-entity-17",
  labelSingular: "SubscriptionsEntity17",
  labelPlural: "SubscriptionsEntity17s",
  endpoint: "/subscriptions/subscriptions-entity-17",
  titleField: "name",
  permissions: { read: "subscriptions.subscriptionsEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const subscriptionsModule = defineModule({
  id: "subscriptions",
  title: "Subscriptions",
  basePath: "/subscriptions",
  permission: "subscriptions.read",
  resources: [
    subscriptionsEntity1Resource,
    subscriptionsEntity2Resource,
    subscriptionsEntity3Resource,
    subscriptionsEntity4Resource,
    subscriptionsEntity5Resource,
    subscriptionsEntity6Resource,
    subscriptionsEntity7Resource,
    subscriptionsEntity8Resource,
    subscriptionsEntity9Resource,
    subscriptionsEntity10Resource,
    subscriptionsEntity11Resource,
    subscriptionsEntity12Resource,
    subscriptionsEntity13Resource,
    subscriptionsEntity14Resource,
    subscriptionsEntity15Resource,
    subscriptionsEntity16Resource,
    subscriptionsEntity17Resource,
  ],
});
