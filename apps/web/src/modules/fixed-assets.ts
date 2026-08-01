import { defineModule, defineResource } from "@unerp/framework";

export const fixedAssetsEntity1Resource = defineResource({
  name: "fixed-assets-entity-1",
  labelSingular: "FixedAssetsEntity1",
  labelPlural: "FixedAssetsEntity1s",
  endpoint: "/fixed-assets/fixed-assets-entity-1",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity2Resource = defineResource({
  name: "fixed-assets-entity-2",
  labelSingular: "FixedAssetsEntity2",
  labelPlural: "FixedAssetsEntity2s",
  endpoint: "/fixed-assets/fixed-assets-entity-2",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity3Resource = defineResource({
  name: "fixed-assets-entity-3",
  labelSingular: "FixedAssetsEntity3",
  labelPlural: "FixedAssetsEntity3s",
  endpoint: "/fixed-assets/fixed-assets-entity-3",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity4Resource = defineResource({
  name: "fixed-assets-entity-4",
  labelSingular: "FixedAssetsEntity4",
  labelPlural: "FixedAssetsEntity4s",
  endpoint: "/fixed-assets/fixed-assets-entity-4",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity5Resource = defineResource({
  name: "fixed-assets-entity-5",
  labelSingular: "FixedAssetsEntity5",
  labelPlural: "FixedAssetsEntity5s",
  endpoint: "/fixed-assets/fixed-assets-entity-5",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity6Resource = defineResource({
  name: "fixed-assets-entity-6",
  labelSingular: "FixedAssetsEntity6",
  labelPlural: "FixedAssetsEntity6s",
  endpoint: "/fixed-assets/fixed-assets-entity-6",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity7Resource = defineResource({
  name: "fixed-assets-entity-7",
  labelSingular: "FixedAssetsEntity7",
  labelPlural: "FixedAssetsEntity7s",
  endpoint: "/fixed-assets/fixed-assets-entity-7",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity8Resource = defineResource({
  name: "fixed-assets-entity-8",
  labelSingular: "FixedAssetsEntity8",
  labelPlural: "FixedAssetsEntity8s",
  endpoint: "/fixed-assets/fixed-assets-entity-8",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity9Resource = defineResource({
  name: "fixed-assets-entity-9",
  labelSingular: "FixedAssetsEntity9",
  labelPlural: "FixedAssetsEntity9s",
  endpoint: "/fixed-assets/fixed-assets-entity-9",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity10Resource = defineResource({
  name: "fixed-assets-entity-10",
  labelSingular: "FixedAssetsEntity10",
  labelPlural: "FixedAssetsEntity10s",
  endpoint: "/fixed-assets/fixed-assets-entity-10",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity11Resource = defineResource({
  name: "fixed-assets-entity-11",
  labelSingular: "FixedAssetsEntity11",
  labelPlural: "FixedAssetsEntity11s",
  endpoint: "/fixed-assets/fixed-assets-entity-11",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity12Resource = defineResource({
  name: "fixed-assets-entity-12",
  labelSingular: "FixedAssetsEntity12",
  labelPlural: "FixedAssetsEntity12s",
  endpoint: "/fixed-assets/fixed-assets-entity-12",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity13Resource = defineResource({
  name: "fixed-assets-entity-13",
  labelSingular: "FixedAssetsEntity13",
  labelPlural: "FixedAssetsEntity13s",
  endpoint: "/fixed-assets/fixed-assets-entity-13",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity14Resource = defineResource({
  name: "fixed-assets-entity-14",
  labelSingular: "FixedAssetsEntity14",
  labelPlural: "FixedAssetsEntity14s",
  endpoint: "/fixed-assets/fixed-assets-entity-14",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity15Resource = defineResource({
  name: "fixed-assets-entity-15",
  labelSingular: "FixedAssetsEntity15",
  labelPlural: "FixedAssetsEntity15s",
  endpoint: "/fixed-assets/fixed-assets-entity-15",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity16Resource = defineResource({
  name: "fixed-assets-entity-16",
  labelSingular: "FixedAssetsEntity16",
  labelPlural: "FixedAssetsEntity16s",
  endpoint: "/fixed-assets/fixed-assets-entity-16",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsEntity17Resource = defineResource({
  name: "fixed-assets-entity-17",
  labelSingular: "FixedAssetsEntity17",
  labelPlural: "FixedAssetsEntity17s",
  endpoint: "/fixed-assets/fixed-assets-entity-17",
  titleField: "name",
  permissions: { read: "fixed-assets.fixedAssetsEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const fixedAssetsModule = defineModule({
  id: "fixed-assets",
  title: "FixedAssets",
  basePath: "/fixed-assets",
  permission: "fixed-assets.read",
  resources: [
    fixedAssetsEntity1Resource,
    fixedAssetsEntity2Resource,
    fixedAssetsEntity3Resource,
    fixedAssetsEntity4Resource,
    fixedAssetsEntity5Resource,
    fixedAssetsEntity6Resource,
    fixedAssetsEntity7Resource,
    fixedAssetsEntity8Resource,
    fixedAssetsEntity9Resource,
    fixedAssetsEntity10Resource,
    fixedAssetsEntity11Resource,
    fixedAssetsEntity12Resource,
    fixedAssetsEntity13Resource,
    fixedAssetsEntity14Resource,
    fixedAssetsEntity15Resource,
    fixedAssetsEntity16Resource,
    fixedAssetsEntity17Resource,
  ],
});
