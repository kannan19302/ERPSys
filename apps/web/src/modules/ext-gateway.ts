// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const extGatewayEntity1Resource = defineResource({
  name: "ext-gateway-entity-1",
  labelSingular: "ExtGatewayEntity1",
  labelPlural: "ExtGatewayEntity1s",
  endpoint: "/ext-gateway/ext-gateway-entity-1",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity2Resource = defineResource({
  name: "ext-gateway-entity-2",
  labelSingular: "ExtGatewayEntity2",
  labelPlural: "ExtGatewayEntity2s",
  endpoint: "/ext-gateway/ext-gateway-entity-2",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity3Resource = defineResource({
  name: "ext-gateway-entity-3",
  labelSingular: "ExtGatewayEntity3",
  labelPlural: "ExtGatewayEntity3s",
  endpoint: "/ext-gateway/ext-gateway-entity-3",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity4Resource = defineResource({
  name: "ext-gateway-entity-4",
  labelSingular: "ExtGatewayEntity4",
  labelPlural: "ExtGatewayEntity4s",
  endpoint: "/ext-gateway/ext-gateway-entity-4",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity5Resource = defineResource({
  name: "ext-gateway-entity-5",
  labelSingular: "ExtGatewayEntity5",
  labelPlural: "ExtGatewayEntity5s",
  endpoint: "/ext-gateway/ext-gateway-entity-5",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity6Resource = defineResource({
  name: "ext-gateway-entity-6",
  labelSingular: "ExtGatewayEntity6",
  labelPlural: "ExtGatewayEntity6s",
  endpoint: "/ext-gateway/ext-gateway-entity-6",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity7Resource = defineResource({
  name: "ext-gateway-entity-7",
  labelSingular: "ExtGatewayEntity7",
  labelPlural: "ExtGatewayEntity7s",
  endpoint: "/ext-gateway/ext-gateway-entity-7",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity8Resource = defineResource({
  name: "ext-gateway-entity-8",
  labelSingular: "ExtGatewayEntity8",
  labelPlural: "ExtGatewayEntity8s",
  endpoint: "/ext-gateway/ext-gateway-entity-8",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity9Resource = defineResource({
  name: "ext-gateway-entity-9",
  labelSingular: "ExtGatewayEntity9",
  labelPlural: "ExtGatewayEntity9s",
  endpoint: "/ext-gateway/ext-gateway-entity-9",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity10Resource = defineResource({
  name: "ext-gateway-entity-10",
  labelSingular: "ExtGatewayEntity10",
  labelPlural: "ExtGatewayEntity10s",
  endpoint: "/ext-gateway/ext-gateway-entity-10",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity11Resource = defineResource({
  name: "ext-gateway-entity-11",
  labelSingular: "ExtGatewayEntity11",
  labelPlural: "ExtGatewayEntity11s",
  endpoint: "/ext-gateway/ext-gateway-entity-11",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity12Resource = defineResource({
  name: "ext-gateway-entity-12",
  labelSingular: "ExtGatewayEntity12",
  labelPlural: "ExtGatewayEntity12s",
  endpoint: "/ext-gateway/ext-gateway-entity-12",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity13Resource = defineResource({
  name: "ext-gateway-entity-13",
  labelSingular: "ExtGatewayEntity13",
  labelPlural: "ExtGatewayEntity13s",
  endpoint: "/ext-gateway/ext-gateway-entity-13",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity14Resource = defineResource({
  name: "ext-gateway-entity-14",
  labelSingular: "ExtGatewayEntity14",
  labelPlural: "ExtGatewayEntity14s",
  endpoint: "/ext-gateway/ext-gateway-entity-14",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity15Resource = defineResource({
  name: "ext-gateway-entity-15",
  labelSingular: "ExtGatewayEntity15",
  labelPlural: "ExtGatewayEntity15s",
  endpoint: "/ext-gateway/ext-gateway-entity-15",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity16Resource = defineResource({
  name: "ext-gateway-entity-16",
  labelSingular: "ExtGatewayEntity16",
  labelPlural: "ExtGatewayEntity16s",
  endpoint: "/ext-gateway/ext-gateway-entity-16",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity17Resource = defineResource({
  name: "ext-gateway-entity-17",
  labelSingular: "ExtGatewayEntity17",
  labelPlural: "ExtGatewayEntity17s",
  endpoint: "/ext-gateway/ext-gateway-entity-17",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity18Resource = defineResource({
  name: "ext-gateway-entity-18",
  labelSingular: "ExtGatewayEntity18",
  labelPlural: "ExtGatewayEntity18s",
  endpoint: "/ext-gateway/ext-gateway-entity-18",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity19Resource = defineResource({
  name: "ext-gateway-entity-19",
  labelSingular: "ExtGatewayEntity19",
  labelPlural: "ExtGatewayEntity19s",
  endpoint: "/ext-gateway/ext-gateway-entity-19",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity20Resource = defineResource({
  name: "ext-gateway-entity-20",
  labelSingular: "ExtGatewayEntity20",
  labelPlural: "ExtGatewayEntity20s",
  endpoint: "/ext-gateway/ext-gateway-entity-20",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity21Resource = defineResource({
  name: "ext-gateway-entity-21",
  labelSingular: "ExtGatewayEntity21",
  labelPlural: "ExtGatewayEntity21s",
  endpoint: "/ext-gateway/ext-gateway-entity-21",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity22Resource = defineResource({
  name: "ext-gateway-entity-22",
  labelSingular: "ExtGatewayEntity22",
  labelPlural: "ExtGatewayEntity22s",
  endpoint: "/ext-gateway/ext-gateway-entity-22",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity22.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity23Resource = defineResource({
  name: "ext-gateway-entity-23",
  labelSingular: "ExtGatewayEntity23",
  labelPlural: "ExtGatewayEntity23s",
  endpoint: "/ext-gateway/ext-gateway-entity-23",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity23.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity24Resource = defineResource({
  name: "ext-gateway-entity-24",
  labelSingular: "ExtGatewayEntity24",
  labelPlural: "ExtGatewayEntity24s",
  endpoint: "/ext-gateway/ext-gateway-entity-24",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity24.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity25Resource = defineResource({
  name: "ext-gateway-entity-25",
  labelSingular: "ExtGatewayEntity25",
  labelPlural: "ExtGatewayEntity25s",
  endpoint: "/ext-gateway/ext-gateway-entity-25",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity25.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity26Resource = defineResource({
  name: "ext-gateway-entity-26",
  labelSingular: "ExtGatewayEntity26",
  labelPlural: "ExtGatewayEntity26s",
  endpoint: "/ext-gateway/ext-gateway-entity-26",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity26.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity27Resource = defineResource({
  name: "ext-gateway-entity-27",
  labelSingular: "ExtGatewayEntity27",
  labelPlural: "ExtGatewayEntity27s",
  endpoint: "/ext-gateway/ext-gateway-entity-27",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity27.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity28Resource = defineResource({
  name: "ext-gateway-entity-28",
  labelSingular: "ExtGatewayEntity28",
  labelPlural: "ExtGatewayEntity28s",
  endpoint: "/ext-gateway/ext-gateway-entity-28",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity28.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity29Resource = defineResource({
  name: "ext-gateway-entity-29",
  labelSingular: "ExtGatewayEntity29",
  labelPlural: "ExtGatewayEntity29s",
  endpoint: "/ext-gateway/ext-gateway-entity-29",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity29.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity30Resource = defineResource({
  name: "ext-gateway-entity-30",
  labelSingular: "ExtGatewayEntity30",
  labelPlural: "ExtGatewayEntity30s",
  endpoint: "/ext-gateway/ext-gateway-entity-30",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity30.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity31Resource = defineResource({
  name: "ext-gateway-entity-31",
  labelSingular: "ExtGatewayEntity31",
  labelPlural: "ExtGatewayEntity31s",
  endpoint: "/ext-gateway/ext-gateway-entity-31",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity31.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity32Resource = defineResource({
  name: "ext-gateway-entity-32",
  labelSingular: "ExtGatewayEntity32",
  labelPlural: "ExtGatewayEntity32s",
  endpoint: "/ext-gateway/ext-gateway-entity-32",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity32.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity33Resource = defineResource({
  name: "ext-gateway-entity-33",
  labelSingular: "ExtGatewayEntity33",
  labelPlural: "ExtGatewayEntity33s",
  endpoint: "/ext-gateway/ext-gateway-entity-33",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity33.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity34Resource = defineResource({
  name: "ext-gateway-entity-34",
  labelSingular: "ExtGatewayEntity34",
  labelPlural: "ExtGatewayEntity34s",
  endpoint: "/ext-gateway/ext-gateway-entity-34",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity34.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayEntity35Resource = defineResource({
  name: "ext-gateway-entity-35",
  labelSingular: "ExtGatewayEntity35",
  labelPlural: "ExtGatewayEntity35s",
  endpoint: "/ext-gateway/ext-gateway-entity-35",
  titleField: "name",
  permissions: { read: "ext-gateway.extGatewayEntity35.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const extGatewayModule = defineModule({
  id: "ext-gateway",
  title: "ExtGateway",
  basePath: "/ext-gateway",
  permission: "ext-gateway.read",
  resources: [
    extGatewayEntity1Resource,
    extGatewayEntity2Resource,
    extGatewayEntity3Resource,
    extGatewayEntity4Resource,
    extGatewayEntity5Resource,
    extGatewayEntity6Resource,
    extGatewayEntity7Resource,
    extGatewayEntity8Resource,
    extGatewayEntity9Resource,
    extGatewayEntity10Resource,
    extGatewayEntity11Resource,
    extGatewayEntity12Resource,
    extGatewayEntity13Resource,
    extGatewayEntity14Resource,
    extGatewayEntity15Resource,
    extGatewayEntity16Resource,
    extGatewayEntity17Resource,
    extGatewayEntity18Resource,
    extGatewayEntity19Resource,
    extGatewayEntity20Resource,
    extGatewayEntity21Resource,
    extGatewayEntity22Resource,
    extGatewayEntity23Resource,
    extGatewayEntity24Resource,
    extGatewayEntity25Resource,
    extGatewayEntity26Resource,
    extGatewayEntity27Resource,
    extGatewayEntity28Resource,
    extGatewayEntity29Resource,
    extGatewayEntity30Resource,
    extGatewayEntity31Resource,
    extGatewayEntity32Resource,
    extGatewayEntity33Resource,
    extGatewayEntity34Resource,
    extGatewayEntity35Resource,
  ],
});
