// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const devopsEntity1Resource = defineResource({
  name: "devops-entity-1",
  labelSingular: "DevopsEntity1",
  labelPlural: "DevopsEntity1s",
  endpoint: "/devops/devops-entity-1",
  titleField: "name",
  permissions: { read: "devops.devopsEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity2Resource = defineResource({
  name: "devops-entity-2",
  labelSingular: "DevopsEntity2",
  labelPlural: "DevopsEntity2s",
  endpoint: "/devops/devops-entity-2",
  titleField: "name",
  permissions: { read: "devops.devopsEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity3Resource = defineResource({
  name: "devops-entity-3",
  labelSingular: "DevopsEntity3",
  labelPlural: "DevopsEntity3s",
  endpoint: "/devops/devops-entity-3",
  titleField: "name",
  permissions: { read: "devops.devopsEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity4Resource = defineResource({
  name: "devops-entity-4",
  labelSingular: "DevopsEntity4",
  labelPlural: "DevopsEntity4s",
  endpoint: "/devops/devops-entity-4",
  titleField: "name",
  permissions: { read: "devops.devopsEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity5Resource = defineResource({
  name: "devops-entity-5",
  labelSingular: "DevopsEntity5",
  labelPlural: "DevopsEntity5s",
  endpoint: "/devops/devops-entity-5",
  titleField: "name",
  permissions: { read: "devops.devopsEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity6Resource = defineResource({
  name: "devops-entity-6",
  labelSingular: "DevopsEntity6",
  labelPlural: "DevopsEntity6s",
  endpoint: "/devops/devops-entity-6",
  titleField: "name",
  permissions: { read: "devops.devopsEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity7Resource = defineResource({
  name: "devops-entity-7",
  labelSingular: "DevopsEntity7",
  labelPlural: "DevopsEntity7s",
  endpoint: "/devops/devops-entity-7",
  titleField: "name",
  permissions: { read: "devops.devopsEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity8Resource = defineResource({
  name: "devops-entity-8",
  labelSingular: "DevopsEntity8",
  labelPlural: "DevopsEntity8s",
  endpoint: "/devops/devops-entity-8",
  titleField: "name",
  permissions: { read: "devops.devopsEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity9Resource = defineResource({
  name: "devops-entity-9",
  labelSingular: "DevopsEntity9",
  labelPlural: "DevopsEntity9s",
  endpoint: "/devops/devops-entity-9",
  titleField: "name",
  permissions: { read: "devops.devopsEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity10Resource = defineResource({
  name: "devops-entity-10",
  labelSingular: "DevopsEntity10",
  labelPlural: "DevopsEntity10s",
  endpoint: "/devops/devops-entity-10",
  titleField: "name",
  permissions: { read: "devops.devopsEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity11Resource = defineResource({
  name: "devops-entity-11",
  labelSingular: "DevopsEntity11",
  labelPlural: "DevopsEntity11s",
  endpoint: "/devops/devops-entity-11",
  titleField: "name",
  permissions: { read: "devops.devopsEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsEntity12Resource = defineResource({
  name: "devops-entity-12",
  labelSingular: "DevopsEntity12",
  labelPlural: "DevopsEntity12s",
  endpoint: "/devops/devops-entity-12",
  titleField: "name",
  permissions: { read: "devops.devopsEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const devopsModule = defineModule({
  id: "devops",
  title: "Devops",
  basePath: "/devops",
  permission: "devops.read",
  resources: [
    devopsEntity1Resource,
    devopsEntity2Resource,
    devopsEntity3Resource,
    devopsEntity4Resource,
    devopsEntity5Resource,
    devopsEntity6Resource,
    devopsEntity7Resource,
    devopsEntity8Resource,
    devopsEntity9Resource,
    devopsEntity10Resource,
    devopsEntity11Resource,
    devopsEntity12Resource,
  ],
});
