// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const pwaEntity1Resource = defineResource({
  name: "pwa-entity-1",
  labelSingular: "PwaEntity1",
  labelPlural: "PwaEntity1s",
  endpoint: "/pwa/pwa-entity-1",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity2Resource = defineResource({
  name: "pwa-entity-2",
  labelSingular: "PwaEntity2",
  labelPlural: "PwaEntity2s",
  endpoint: "/pwa/pwa-entity-2",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity3Resource = defineResource({
  name: "pwa-entity-3",
  labelSingular: "PwaEntity3",
  labelPlural: "PwaEntity3s",
  endpoint: "/pwa/pwa-entity-3",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity4Resource = defineResource({
  name: "pwa-entity-4",
  labelSingular: "PwaEntity4",
  labelPlural: "PwaEntity4s",
  endpoint: "/pwa/pwa-entity-4",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity5Resource = defineResource({
  name: "pwa-entity-5",
  labelSingular: "PwaEntity5",
  labelPlural: "PwaEntity5s",
  endpoint: "/pwa/pwa-entity-5",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity6Resource = defineResource({
  name: "pwa-entity-6",
  labelSingular: "PwaEntity6",
  labelPlural: "PwaEntity6s",
  endpoint: "/pwa/pwa-entity-6",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity7Resource = defineResource({
  name: "pwa-entity-7",
  labelSingular: "PwaEntity7",
  labelPlural: "PwaEntity7s",
  endpoint: "/pwa/pwa-entity-7",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity8Resource = defineResource({
  name: "pwa-entity-8",
  labelSingular: "PwaEntity8",
  labelPlural: "PwaEntity8s",
  endpoint: "/pwa/pwa-entity-8",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity9Resource = defineResource({
  name: "pwa-entity-9",
  labelSingular: "PwaEntity9",
  labelPlural: "PwaEntity9s",
  endpoint: "/pwa/pwa-entity-9",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity10Resource = defineResource({
  name: "pwa-entity-10",
  labelSingular: "PwaEntity10",
  labelPlural: "PwaEntity10s",
  endpoint: "/pwa/pwa-entity-10",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity11Resource = defineResource({
  name: "pwa-entity-11",
  labelSingular: "PwaEntity11",
  labelPlural: "PwaEntity11s",
  endpoint: "/pwa/pwa-entity-11",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity12Resource = defineResource({
  name: "pwa-entity-12",
  labelSingular: "PwaEntity12",
  labelPlural: "PwaEntity12s",
  endpoint: "/pwa/pwa-entity-12",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity13Resource = defineResource({
  name: "pwa-entity-13",
  labelSingular: "PwaEntity13",
  labelPlural: "PwaEntity13s",
  endpoint: "/pwa/pwa-entity-13",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity14Resource = defineResource({
  name: "pwa-entity-14",
  labelSingular: "PwaEntity14",
  labelPlural: "PwaEntity14s",
  endpoint: "/pwa/pwa-entity-14",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity15Resource = defineResource({
  name: "pwa-entity-15",
  labelSingular: "PwaEntity15",
  labelPlural: "PwaEntity15s",
  endpoint: "/pwa/pwa-entity-15",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity16Resource = defineResource({
  name: "pwa-entity-16",
  labelSingular: "PwaEntity16",
  labelPlural: "PwaEntity16s",
  endpoint: "/pwa/pwa-entity-16",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity17Resource = defineResource({
  name: "pwa-entity-17",
  labelSingular: "PwaEntity17",
  labelPlural: "PwaEntity17s",
  endpoint: "/pwa/pwa-entity-17",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity18Resource = defineResource({
  name: "pwa-entity-18",
  labelSingular: "PwaEntity18",
  labelPlural: "PwaEntity18s",
  endpoint: "/pwa/pwa-entity-18",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity19Resource = defineResource({
  name: "pwa-entity-19",
  labelSingular: "PwaEntity19",
  labelPlural: "PwaEntity19s",
  endpoint: "/pwa/pwa-entity-19",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity20Resource = defineResource({
  name: "pwa-entity-20",
  labelSingular: "PwaEntity20",
  labelPlural: "PwaEntity20s",
  endpoint: "/pwa/pwa-entity-20",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaEntity21Resource = defineResource({
  name: "pwa-entity-21",
  labelSingular: "PwaEntity21",
  labelPlural: "PwaEntity21s",
  endpoint: "/pwa/pwa-entity-21",
  titleField: "name",
  permissions: { read: "pwa.pwaEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const pwaModule = defineModule({
  id: "pwa",
  title: "Pwa",
  basePath: "/pwa",
  permission: "pwa.read",
  resources: [
    pwaEntity1Resource,
    pwaEntity2Resource,
    pwaEntity3Resource,
    pwaEntity4Resource,
    pwaEntity5Resource,
    pwaEntity6Resource,
    pwaEntity7Resource,
    pwaEntity8Resource,
    pwaEntity9Resource,
    pwaEntity10Resource,
    pwaEntity11Resource,
    pwaEntity12Resource,
    pwaEntity13Resource,
    pwaEntity14Resource,
    pwaEntity15Resource,
    pwaEntity16Resource,
    pwaEntity17Resource,
    pwaEntity18Resource,
    pwaEntity19Resource,
    pwaEntity20Resource,
    pwaEntity21Resource,
  ],
});
