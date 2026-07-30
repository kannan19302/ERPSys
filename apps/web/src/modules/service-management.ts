import { defineModule, defineResource } from "@unerp/framework";

export const serviceManagementEntity1Resource = defineResource({
  name: "service-management-entity-1",
  labelSingular: "ServiceManagementEntity1",
  labelPlural: "ServiceManagementEntity1s",
  endpoint: "/service-management/service-management-entity-1",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity2Resource = defineResource({
  name: "service-management-entity-2",
  labelSingular: "ServiceManagementEntity2",
  labelPlural: "ServiceManagementEntity2s",
  endpoint: "/service-management/service-management-entity-2",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity3Resource = defineResource({
  name: "service-management-entity-3",
  labelSingular: "ServiceManagementEntity3",
  labelPlural: "ServiceManagementEntity3s",
  endpoint: "/service-management/service-management-entity-3",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity4Resource = defineResource({
  name: "service-management-entity-4",
  labelSingular: "ServiceManagementEntity4",
  labelPlural: "ServiceManagementEntity4s",
  endpoint: "/service-management/service-management-entity-4",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity5Resource = defineResource({
  name: "service-management-entity-5",
  labelSingular: "ServiceManagementEntity5",
  labelPlural: "ServiceManagementEntity5s",
  endpoint: "/service-management/service-management-entity-5",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity6Resource = defineResource({
  name: "service-management-entity-6",
  labelSingular: "ServiceManagementEntity6",
  labelPlural: "ServiceManagementEntity6s",
  endpoint: "/service-management/service-management-entity-6",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity7Resource = defineResource({
  name: "service-management-entity-7",
  labelSingular: "ServiceManagementEntity7",
  labelPlural: "ServiceManagementEntity7s",
  endpoint: "/service-management/service-management-entity-7",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity8Resource = defineResource({
  name: "service-management-entity-8",
  labelSingular: "ServiceManagementEntity8",
  labelPlural: "ServiceManagementEntity8s",
  endpoint: "/service-management/service-management-entity-8",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity9Resource = defineResource({
  name: "service-management-entity-9",
  labelSingular: "ServiceManagementEntity9",
  labelPlural: "ServiceManagementEntity9s",
  endpoint: "/service-management/service-management-entity-9",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity10Resource = defineResource({
  name: "service-management-entity-10",
  labelSingular: "ServiceManagementEntity10",
  labelPlural: "ServiceManagementEntity10s",
  endpoint: "/service-management/service-management-entity-10",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity11Resource = defineResource({
  name: "service-management-entity-11",
  labelSingular: "ServiceManagementEntity11",
  labelPlural: "ServiceManagementEntity11s",
  endpoint: "/service-management/service-management-entity-11",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity12Resource = defineResource({
  name: "service-management-entity-12",
  labelSingular: "ServiceManagementEntity12",
  labelPlural: "ServiceManagementEntity12s",
  endpoint: "/service-management/service-management-entity-12",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity13Resource = defineResource({
  name: "service-management-entity-13",
  labelSingular: "ServiceManagementEntity13",
  labelPlural: "ServiceManagementEntity13s",
  endpoint: "/service-management/service-management-entity-13",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity14Resource = defineResource({
  name: "service-management-entity-14",
  labelSingular: "ServiceManagementEntity14",
  labelPlural: "ServiceManagementEntity14s",
  endpoint: "/service-management/service-management-entity-14",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity15Resource = defineResource({
  name: "service-management-entity-15",
  labelSingular: "ServiceManagementEntity15",
  labelPlural: "ServiceManagementEntity15s",
  endpoint: "/service-management/service-management-entity-15",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity16Resource = defineResource({
  name: "service-management-entity-16",
  labelSingular: "ServiceManagementEntity16",
  labelPlural: "ServiceManagementEntity16s",
  endpoint: "/service-management/service-management-entity-16",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity17Resource = defineResource({
  name: "service-management-entity-17",
  labelSingular: "ServiceManagementEntity17",
  labelPlural: "ServiceManagementEntity17s",
  endpoint: "/service-management/service-management-entity-17",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity18Resource = defineResource({
  name: "service-management-entity-18",
  labelSingular: "ServiceManagementEntity18",
  labelPlural: "ServiceManagementEntity18s",
  endpoint: "/service-management/service-management-entity-18",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity19Resource = defineResource({
  name: "service-management-entity-19",
  labelSingular: "ServiceManagementEntity19",
  labelPlural: "ServiceManagementEntity19s",
  endpoint: "/service-management/service-management-entity-19",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity20Resource = defineResource({
  name: "service-management-entity-20",
  labelSingular: "ServiceManagementEntity20",
  labelPlural: "ServiceManagementEntity20s",
  endpoint: "/service-management/service-management-entity-20",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity21Resource = defineResource({
  name: "service-management-entity-21",
  labelSingular: "ServiceManagementEntity21",
  labelPlural: "ServiceManagementEntity21s",
  endpoint: "/service-management/service-management-entity-21",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity22Resource = defineResource({
  name: "service-management-entity-22",
  labelSingular: "ServiceManagementEntity22",
  labelPlural: "ServiceManagementEntity22s",
  endpoint: "/service-management/service-management-entity-22",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity22.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity23Resource = defineResource({
  name: "service-management-entity-23",
  labelSingular: "ServiceManagementEntity23",
  labelPlural: "ServiceManagementEntity23s",
  endpoint: "/service-management/service-management-entity-23",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity23.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity24Resource = defineResource({
  name: "service-management-entity-24",
  labelSingular: "ServiceManagementEntity24",
  labelPlural: "ServiceManagementEntity24s",
  endpoint: "/service-management/service-management-entity-24",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity24.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity25Resource = defineResource({
  name: "service-management-entity-25",
  labelSingular: "ServiceManagementEntity25",
  labelPlural: "ServiceManagementEntity25s",
  endpoint: "/service-management/service-management-entity-25",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity25.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity26Resource = defineResource({
  name: "service-management-entity-26",
  labelSingular: "ServiceManagementEntity26",
  labelPlural: "ServiceManagementEntity26s",
  endpoint: "/service-management/service-management-entity-26",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity26.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity27Resource = defineResource({
  name: "service-management-entity-27",
  labelSingular: "ServiceManagementEntity27",
  labelPlural: "ServiceManagementEntity27s",
  endpoint: "/service-management/service-management-entity-27",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity27.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity28Resource = defineResource({
  name: "service-management-entity-28",
  labelSingular: "ServiceManagementEntity28",
  labelPlural: "ServiceManagementEntity28s",
  endpoint: "/service-management/service-management-entity-28",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity28.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity29Resource = defineResource({
  name: "service-management-entity-29",
  labelSingular: "ServiceManagementEntity29",
  labelPlural: "ServiceManagementEntity29s",
  endpoint: "/service-management/service-management-entity-29",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity29.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity30Resource = defineResource({
  name: "service-management-entity-30",
  labelSingular: "ServiceManagementEntity30",
  labelPlural: "ServiceManagementEntity30s",
  endpoint: "/service-management/service-management-entity-30",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity30.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity31Resource = defineResource({
  name: "service-management-entity-31",
  labelSingular: "ServiceManagementEntity31",
  labelPlural: "ServiceManagementEntity31s",
  endpoint: "/service-management/service-management-entity-31",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity31.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity32Resource = defineResource({
  name: "service-management-entity-32",
  labelSingular: "ServiceManagementEntity32",
  labelPlural: "ServiceManagementEntity32s",
  endpoint: "/service-management/service-management-entity-32",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity32.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity33Resource = defineResource({
  name: "service-management-entity-33",
  labelSingular: "ServiceManagementEntity33",
  labelPlural: "ServiceManagementEntity33s",
  endpoint: "/service-management/service-management-entity-33",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity33.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity34Resource = defineResource({
  name: "service-management-entity-34",
  labelSingular: "ServiceManagementEntity34",
  labelPlural: "ServiceManagementEntity34s",
  endpoint: "/service-management/service-management-entity-34",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity34.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity35Resource = defineResource({
  name: "service-management-entity-35",
  labelSingular: "ServiceManagementEntity35",
  labelPlural: "ServiceManagementEntity35s",
  endpoint: "/service-management/service-management-entity-35",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity35.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity36Resource = defineResource({
  name: "service-management-entity-36",
  labelSingular: "ServiceManagementEntity36",
  labelPlural: "ServiceManagementEntity36s",
  endpoint: "/service-management/service-management-entity-36",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity36.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity37Resource = defineResource({
  name: "service-management-entity-37",
  labelSingular: "ServiceManagementEntity37",
  labelPlural: "ServiceManagementEntity37s",
  endpoint: "/service-management/service-management-entity-37",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity37.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity38Resource = defineResource({
  name: "service-management-entity-38",
  labelSingular: "ServiceManagementEntity38",
  labelPlural: "ServiceManagementEntity38s",
  endpoint: "/service-management/service-management-entity-38",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity38.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity39Resource = defineResource({
  name: "service-management-entity-39",
  labelSingular: "ServiceManagementEntity39",
  labelPlural: "ServiceManagementEntity39s",
  endpoint: "/service-management/service-management-entity-39",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity39.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity40Resource = defineResource({
  name: "service-management-entity-40",
  labelSingular: "ServiceManagementEntity40",
  labelPlural: "ServiceManagementEntity40s",
  endpoint: "/service-management/service-management-entity-40",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity40.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementEntity41Resource = defineResource({
  name: "service-management-entity-41",
  labelSingular: "ServiceManagementEntity41",
  labelPlural: "ServiceManagementEntity41s",
  endpoint: "/service-management/service-management-entity-41",
  titleField: "name",
  permissions: { read: "service-management.serviceManagementEntity41.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const serviceManagementModule = defineModule({
  id: "service-management",
  title: "ServiceManagement",
  basePath: "/service-management",
  permission: "service-management.read",
  resources: [
    serviceManagementEntity1Resource,
    serviceManagementEntity2Resource,
    serviceManagementEntity3Resource,
    serviceManagementEntity4Resource,
    serviceManagementEntity5Resource,
    serviceManagementEntity6Resource,
    serviceManagementEntity7Resource,
    serviceManagementEntity8Resource,
    serviceManagementEntity9Resource,
    serviceManagementEntity10Resource,
    serviceManagementEntity11Resource,
    serviceManagementEntity12Resource,
    serviceManagementEntity13Resource,
    serviceManagementEntity14Resource,
    serviceManagementEntity15Resource,
    serviceManagementEntity16Resource,
    serviceManagementEntity17Resource,
    serviceManagementEntity18Resource,
    serviceManagementEntity19Resource,
    serviceManagementEntity20Resource,
    serviceManagementEntity21Resource,
    serviceManagementEntity22Resource,
    serviceManagementEntity23Resource,
    serviceManagementEntity24Resource,
    serviceManagementEntity25Resource,
    serviceManagementEntity26Resource,
    serviceManagementEntity27Resource,
    serviceManagementEntity28Resource,
    serviceManagementEntity29Resource,
    serviceManagementEntity30Resource,
    serviceManagementEntity31Resource,
    serviceManagementEntity32Resource,
    serviceManagementEntity33Resource,
    serviceManagementEntity34Resource,
    serviceManagementEntity35Resource,
    serviceManagementEntity36Resource,
    serviceManagementEntity37Resource,
    serviceManagementEntity38Resource,
    serviceManagementEntity39Resource,
    serviceManagementEntity40Resource,
    serviceManagementEntity41Resource,
  ],
});
