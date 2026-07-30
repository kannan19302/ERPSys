// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const searchEntity1Resource = defineResource({
  name: "search-entity-1",
  labelSingular: "SearchEntity1",
  labelPlural: "SearchEntity1s",
  endpoint: "/search/search-entity-1",
  titleField: "name",
  permissions: { read: "search.searchEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity2Resource = defineResource({
  name: "search-entity-2",
  labelSingular: "SearchEntity2",
  labelPlural: "SearchEntity2s",
  endpoint: "/search/search-entity-2",
  titleField: "name",
  permissions: { read: "search.searchEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity3Resource = defineResource({
  name: "search-entity-3",
  labelSingular: "SearchEntity3",
  labelPlural: "SearchEntity3s",
  endpoint: "/search/search-entity-3",
  titleField: "name",
  permissions: { read: "search.searchEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity4Resource = defineResource({
  name: "search-entity-4",
  labelSingular: "SearchEntity4",
  labelPlural: "SearchEntity4s",
  endpoint: "/search/search-entity-4",
  titleField: "name",
  permissions: { read: "search.searchEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity5Resource = defineResource({
  name: "search-entity-5",
  labelSingular: "SearchEntity5",
  labelPlural: "SearchEntity5s",
  endpoint: "/search/search-entity-5",
  titleField: "name",
  permissions: { read: "search.searchEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity6Resource = defineResource({
  name: "search-entity-6",
  labelSingular: "SearchEntity6",
  labelPlural: "SearchEntity6s",
  endpoint: "/search/search-entity-6",
  titleField: "name",
  permissions: { read: "search.searchEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity7Resource = defineResource({
  name: "search-entity-7",
  labelSingular: "SearchEntity7",
  labelPlural: "SearchEntity7s",
  endpoint: "/search/search-entity-7",
  titleField: "name",
  permissions: { read: "search.searchEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity8Resource = defineResource({
  name: "search-entity-8",
  labelSingular: "SearchEntity8",
  labelPlural: "SearchEntity8s",
  endpoint: "/search/search-entity-8",
  titleField: "name",
  permissions: { read: "search.searchEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity9Resource = defineResource({
  name: "search-entity-9",
  labelSingular: "SearchEntity9",
  labelPlural: "SearchEntity9s",
  endpoint: "/search/search-entity-9",
  titleField: "name",
  permissions: { read: "search.searchEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity10Resource = defineResource({
  name: "search-entity-10",
  labelSingular: "SearchEntity10",
  labelPlural: "SearchEntity10s",
  endpoint: "/search/search-entity-10",
  titleField: "name",
  permissions: { read: "search.searchEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity11Resource = defineResource({
  name: "search-entity-11",
  labelSingular: "SearchEntity11",
  labelPlural: "SearchEntity11s",
  endpoint: "/search/search-entity-11",
  titleField: "name",
  permissions: { read: "search.searchEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity12Resource = defineResource({
  name: "search-entity-12",
  labelSingular: "SearchEntity12",
  labelPlural: "SearchEntity12s",
  endpoint: "/search/search-entity-12",
  titleField: "name",
  permissions: { read: "search.searchEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity13Resource = defineResource({
  name: "search-entity-13",
  labelSingular: "SearchEntity13",
  labelPlural: "SearchEntity13s",
  endpoint: "/search/search-entity-13",
  titleField: "name",
  permissions: { read: "search.searchEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity14Resource = defineResource({
  name: "search-entity-14",
  labelSingular: "SearchEntity14",
  labelPlural: "SearchEntity14s",
  endpoint: "/search/search-entity-14",
  titleField: "name",
  permissions: { read: "search.searchEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity15Resource = defineResource({
  name: "search-entity-15",
  labelSingular: "SearchEntity15",
  labelPlural: "SearchEntity15s",
  endpoint: "/search/search-entity-15",
  titleField: "name",
  permissions: { read: "search.searchEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity16Resource = defineResource({
  name: "search-entity-16",
  labelSingular: "SearchEntity16",
  labelPlural: "SearchEntity16s",
  endpoint: "/search/search-entity-16",
  titleField: "name",
  permissions: { read: "search.searchEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity17Resource = defineResource({
  name: "search-entity-17",
  labelSingular: "SearchEntity17",
  labelPlural: "SearchEntity17s",
  endpoint: "/search/search-entity-17",
  titleField: "name",
  permissions: { read: "search.searchEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity18Resource = defineResource({
  name: "search-entity-18",
  labelSingular: "SearchEntity18",
  labelPlural: "SearchEntity18s",
  endpoint: "/search/search-entity-18",
  titleField: "name",
  permissions: { read: "search.searchEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity19Resource = defineResource({
  name: "search-entity-19",
  labelSingular: "SearchEntity19",
  labelPlural: "SearchEntity19s",
  endpoint: "/search/search-entity-19",
  titleField: "name",
  permissions: { read: "search.searchEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity20Resource = defineResource({
  name: "search-entity-20",
  labelSingular: "SearchEntity20",
  labelPlural: "SearchEntity20s",
  endpoint: "/search/search-entity-20",
  titleField: "name",
  permissions: { read: "search.searchEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity21Resource = defineResource({
  name: "search-entity-21",
  labelSingular: "SearchEntity21",
  labelPlural: "SearchEntity21s",
  endpoint: "/search/search-entity-21",
  titleField: "name",
  permissions: { read: "search.searchEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity22Resource = defineResource({
  name: "search-entity-22",
  labelSingular: "SearchEntity22",
  labelPlural: "SearchEntity22s",
  endpoint: "/search/search-entity-22",
  titleField: "name",
  permissions: { read: "search.searchEntity22.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity23Resource = defineResource({
  name: "search-entity-23",
  labelSingular: "SearchEntity23",
  labelPlural: "SearchEntity23s",
  endpoint: "/search/search-entity-23",
  titleField: "name",
  permissions: { read: "search.searchEntity23.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity24Resource = defineResource({
  name: "search-entity-24",
  labelSingular: "SearchEntity24",
  labelPlural: "SearchEntity24s",
  endpoint: "/search/search-entity-24",
  titleField: "name",
  permissions: { read: "search.searchEntity24.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity25Resource = defineResource({
  name: "search-entity-25",
  labelSingular: "SearchEntity25",
  labelPlural: "SearchEntity25s",
  endpoint: "/search/search-entity-25",
  titleField: "name",
  permissions: { read: "search.searchEntity25.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity26Resource = defineResource({
  name: "search-entity-26",
  labelSingular: "SearchEntity26",
  labelPlural: "SearchEntity26s",
  endpoint: "/search/search-entity-26",
  titleField: "name",
  permissions: { read: "search.searchEntity26.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity27Resource = defineResource({
  name: "search-entity-27",
  labelSingular: "SearchEntity27",
  labelPlural: "SearchEntity27s",
  endpoint: "/search/search-entity-27",
  titleField: "name",
  permissions: { read: "search.searchEntity27.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity28Resource = defineResource({
  name: "search-entity-28",
  labelSingular: "SearchEntity28",
  labelPlural: "SearchEntity28s",
  endpoint: "/search/search-entity-28",
  titleField: "name",
  permissions: { read: "search.searchEntity28.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity29Resource = defineResource({
  name: "search-entity-29",
  labelSingular: "SearchEntity29",
  labelPlural: "SearchEntity29s",
  endpoint: "/search/search-entity-29",
  titleField: "name",
  permissions: { read: "search.searchEntity29.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity30Resource = defineResource({
  name: "search-entity-30",
  labelSingular: "SearchEntity30",
  labelPlural: "SearchEntity30s",
  endpoint: "/search/search-entity-30",
  titleField: "name",
  permissions: { read: "search.searchEntity30.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity31Resource = defineResource({
  name: "search-entity-31",
  labelSingular: "SearchEntity31",
  labelPlural: "SearchEntity31s",
  endpoint: "/search/search-entity-31",
  titleField: "name",
  permissions: { read: "search.searchEntity31.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity32Resource = defineResource({
  name: "search-entity-32",
  labelSingular: "SearchEntity32",
  labelPlural: "SearchEntity32s",
  endpoint: "/search/search-entity-32",
  titleField: "name",
  permissions: { read: "search.searchEntity32.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity33Resource = defineResource({
  name: "search-entity-33",
  labelSingular: "SearchEntity33",
  labelPlural: "SearchEntity33s",
  endpoint: "/search/search-entity-33",
  titleField: "name",
  permissions: { read: "search.searchEntity33.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity34Resource = defineResource({
  name: "search-entity-34",
  labelSingular: "SearchEntity34",
  labelPlural: "SearchEntity34s",
  endpoint: "/search/search-entity-34",
  titleField: "name",
  permissions: { read: "search.searchEntity34.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity35Resource = defineResource({
  name: "search-entity-35",
  labelSingular: "SearchEntity35",
  labelPlural: "SearchEntity35s",
  endpoint: "/search/search-entity-35",
  titleField: "name",
  permissions: { read: "search.searchEntity35.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity36Resource = defineResource({
  name: "search-entity-36",
  labelSingular: "SearchEntity36",
  labelPlural: "SearchEntity36s",
  endpoint: "/search/search-entity-36",
  titleField: "name",
  permissions: { read: "search.searchEntity36.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchEntity37Resource = defineResource({
  name: "search-entity-37",
  labelSingular: "SearchEntity37",
  labelPlural: "SearchEntity37s",
  endpoint: "/search/search-entity-37",
  titleField: "name",
  permissions: { read: "search.searchEntity37.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const searchModule = defineModule({
  id: "search",
  title: "Search",
  basePath: "/search",
  permission: "search.read",
  resources: [
    searchEntity1Resource,
    searchEntity2Resource,
    searchEntity3Resource,
    searchEntity4Resource,
    searchEntity5Resource,
    searchEntity6Resource,
    searchEntity7Resource,
    searchEntity8Resource,
    searchEntity9Resource,
    searchEntity10Resource,
    searchEntity11Resource,
    searchEntity12Resource,
    searchEntity13Resource,
    searchEntity14Resource,
    searchEntity15Resource,
    searchEntity16Resource,
    searchEntity17Resource,
    searchEntity18Resource,
    searchEntity19Resource,
    searchEntity20Resource,
    searchEntity21Resource,
    searchEntity22Resource,
    searchEntity23Resource,
    searchEntity24Resource,
    searchEntity25Resource,
    searchEntity26Resource,
    searchEntity27Resource,
    searchEntity28Resource,
    searchEntity29Resource,
    searchEntity30Resource,
    searchEntity31Resource,
    searchEntity32Resource,
    searchEntity33Resource,
    searchEntity34Resource,
    searchEntity35Resource,
    searchEntity36Resource,
    searchEntity37Resource,
  ],
});
