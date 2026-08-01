import { defineModule, defineResource } from "@unerp/framework";

export const peopleEntity1Resource = defineResource({
  name: "people-entity-1",
  labelSingular: "PeopleEntity1",
  labelPlural: "PeopleEntity1s",
  endpoint: "/people/people-entity-1",
  titleField: "name",
  permissions: { read: "people.peopleEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity2Resource = defineResource({
  name: "people-entity-2",
  labelSingular: "PeopleEntity2",
  labelPlural: "PeopleEntity2s",
  endpoint: "/people/people-entity-2",
  titleField: "name",
  permissions: { read: "people.peopleEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity3Resource = defineResource({
  name: "people-entity-3",
  labelSingular: "PeopleEntity3",
  labelPlural: "PeopleEntity3s",
  endpoint: "/people/people-entity-3",
  titleField: "name",
  permissions: { read: "people.peopleEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity4Resource = defineResource({
  name: "people-entity-4",
  labelSingular: "PeopleEntity4",
  labelPlural: "PeopleEntity4s",
  endpoint: "/people/people-entity-4",
  titleField: "name",
  permissions: { read: "people.peopleEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity5Resource = defineResource({
  name: "people-entity-5",
  labelSingular: "PeopleEntity5",
  labelPlural: "PeopleEntity5s",
  endpoint: "/people/people-entity-5",
  titleField: "name",
  permissions: { read: "people.peopleEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity6Resource = defineResource({
  name: "people-entity-6",
  labelSingular: "PeopleEntity6",
  labelPlural: "PeopleEntity6s",
  endpoint: "/people/people-entity-6",
  titleField: "name",
  permissions: { read: "people.peopleEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity7Resource = defineResource({
  name: "people-entity-7",
  labelSingular: "PeopleEntity7",
  labelPlural: "PeopleEntity7s",
  endpoint: "/people/people-entity-7",
  titleField: "name",
  permissions: { read: "people.peopleEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity8Resource = defineResource({
  name: "people-entity-8",
  labelSingular: "PeopleEntity8",
  labelPlural: "PeopleEntity8s",
  endpoint: "/people/people-entity-8",
  titleField: "name",
  permissions: { read: "people.peopleEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity9Resource = defineResource({
  name: "people-entity-9",
  labelSingular: "PeopleEntity9",
  labelPlural: "PeopleEntity9s",
  endpoint: "/people/people-entity-9",
  titleField: "name",
  permissions: { read: "people.peopleEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity10Resource = defineResource({
  name: "people-entity-10",
  labelSingular: "PeopleEntity10",
  labelPlural: "PeopleEntity10s",
  endpoint: "/people/people-entity-10",
  titleField: "name",
  permissions: { read: "people.peopleEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity11Resource = defineResource({
  name: "people-entity-11",
  labelSingular: "PeopleEntity11",
  labelPlural: "PeopleEntity11s",
  endpoint: "/people/people-entity-11",
  titleField: "name",
  permissions: { read: "people.peopleEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity12Resource = defineResource({
  name: "people-entity-12",
  labelSingular: "PeopleEntity12",
  labelPlural: "PeopleEntity12s",
  endpoint: "/people/people-entity-12",
  titleField: "name",
  permissions: { read: "people.peopleEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity13Resource = defineResource({
  name: "people-entity-13",
  labelSingular: "PeopleEntity13",
  labelPlural: "PeopleEntity13s",
  endpoint: "/people/people-entity-13",
  titleField: "name",
  permissions: { read: "people.peopleEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity14Resource = defineResource({
  name: "people-entity-14",
  labelSingular: "PeopleEntity14",
  labelPlural: "PeopleEntity14s",
  endpoint: "/people/people-entity-14",
  titleField: "name",
  permissions: { read: "people.peopleEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity15Resource = defineResource({
  name: "people-entity-15",
  labelSingular: "PeopleEntity15",
  labelPlural: "PeopleEntity15s",
  endpoint: "/people/people-entity-15",
  titleField: "name",
  permissions: { read: "people.peopleEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity16Resource = defineResource({
  name: "people-entity-16",
  labelSingular: "PeopleEntity16",
  labelPlural: "PeopleEntity16s",
  endpoint: "/people/people-entity-16",
  titleField: "name",
  permissions: { read: "people.peopleEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity17Resource = defineResource({
  name: "people-entity-17",
  labelSingular: "PeopleEntity17",
  labelPlural: "PeopleEntity17s",
  endpoint: "/people/people-entity-17",
  titleField: "name",
  permissions: { read: "people.peopleEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity18Resource = defineResource({
  name: "people-entity-18",
  labelSingular: "PeopleEntity18",
  labelPlural: "PeopleEntity18s",
  endpoint: "/people/people-entity-18",
  titleField: "name",
  permissions: { read: "people.peopleEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity19Resource = defineResource({
  name: "people-entity-19",
  labelSingular: "PeopleEntity19",
  labelPlural: "PeopleEntity19s",
  endpoint: "/people/people-entity-19",
  titleField: "name",
  permissions: { read: "people.peopleEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity20Resource = defineResource({
  name: "people-entity-20",
  labelSingular: "PeopleEntity20",
  labelPlural: "PeopleEntity20s",
  endpoint: "/people/people-entity-20",
  titleField: "name",
  permissions: { read: "people.peopleEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity21Resource = defineResource({
  name: "people-entity-21",
  labelSingular: "PeopleEntity21",
  labelPlural: "PeopleEntity21s",
  endpoint: "/people/people-entity-21",
  titleField: "name",
  permissions: { read: "people.peopleEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity22Resource = defineResource({
  name: "people-entity-22",
  labelSingular: "PeopleEntity22",
  labelPlural: "PeopleEntity22s",
  endpoint: "/people/people-entity-22",
  titleField: "name",
  permissions: { read: "people.peopleEntity22.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity23Resource = defineResource({
  name: "people-entity-23",
  labelSingular: "PeopleEntity23",
  labelPlural: "PeopleEntity23s",
  endpoint: "/people/people-entity-23",
  titleField: "name",
  permissions: { read: "people.peopleEntity23.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity24Resource = defineResource({
  name: "people-entity-24",
  labelSingular: "PeopleEntity24",
  labelPlural: "PeopleEntity24s",
  endpoint: "/people/people-entity-24",
  titleField: "name",
  permissions: { read: "people.peopleEntity24.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity25Resource = defineResource({
  name: "people-entity-25",
  labelSingular: "PeopleEntity25",
  labelPlural: "PeopleEntity25s",
  endpoint: "/people/people-entity-25",
  titleField: "name",
  permissions: { read: "people.peopleEntity25.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity26Resource = defineResource({
  name: "people-entity-26",
  labelSingular: "PeopleEntity26",
  labelPlural: "PeopleEntity26s",
  endpoint: "/people/people-entity-26",
  titleField: "name",
  permissions: { read: "people.peopleEntity26.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity27Resource = defineResource({
  name: "people-entity-27",
  labelSingular: "PeopleEntity27",
  labelPlural: "PeopleEntity27s",
  endpoint: "/people/people-entity-27",
  titleField: "name",
  permissions: { read: "people.peopleEntity27.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity28Resource = defineResource({
  name: "people-entity-28",
  labelSingular: "PeopleEntity28",
  labelPlural: "PeopleEntity28s",
  endpoint: "/people/people-entity-28",
  titleField: "name",
  permissions: { read: "people.peopleEntity28.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity29Resource = defineResource({
  name: "people-entity-29",
  labelSingular: "PeopleEntity29",
  labelPlural: "PeopleEntity29s",
  endpoint: "/people/people-entity-29",
  titleField: "name",
  permissions: { read: "people.peopleEntity29.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity30Resource = defineResource({
  name: "people-entity-30",
  labelSingular: "PeopleEntity30",
  labelPlural: "PeopleEntity30s",
  endpoint: "/people/people-entity-30",
  titleField: "name",
  permissions: { read: "people.peopleEntity30.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity31Resource = defineResource({
  name: "people-entity-31",
  labelSingular: "PeopleEntity31",
  labelPlural: "PeopleEntity31s",
  endpoint: "/people/people-entity-31",
  titleField: "name",
  permissions: { read: "people.peopleEntity31.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity32Resource = defineResource({
  name: "people-entity-32",
  labelSingular: "PeopleEntity32",
  labelPlural: "PeopleEntity32s",
  endpoint: "/people/people-entity-32",
  titleField: "name",
  permissions: { read: "people.peopleEntity32.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity33Resource = defineResource({
  name: "people-entity-33",
  labelSingular: "PeopleEntity33",
  labelPlural: "PeopleEntity33s",
  endpoint: "/people/people-entity-33",
  titleField: "name",
  permissions: { read: "people.peopleEntity33.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity34Resource = defineResource({
  name: "people-entity-34",
  labelSingular: "PeopleEntity34",
  labelPlural: "PeopleEntity34s",
  endpoint: "/people/people-entity-34",
  titleField: "name",
  permissions: { read: "people.peopleEntity34.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity35Resource = defineResource({
  name: "people-entity-35",
  labelSingular: "PeopleEntity35",
  labelPlural: "PeopleEntity35s",
  endpoint: "/people/people-entity-35",
  titleField: "name",
  permissions: { read: "people.peopleEntity35.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity36Resource = defineResource({
  name: "people-entity-36",
  labelSingular: "PeopleEntity36",
  labelPlural: "PeopleEntity36s",
  endpoint: "/people/people-entity-36",
  titleField: "name",
  permissions: { read: "people.peopleEntity36.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity37Resource = defineResource({
  name: "people-entity-37",
  labelSingular: "PeopleEntity37",
  labelPlural: "PeopleEntity37s",
  endpoint: "/people/people-entity-37",
  titleField: "name",
  permissions: { read: "people.peopleEntity37.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity38Resource = defineResource({
  name: "people-entity-38",
  labelSingular: "PeopleEntity38",
  labelPlural: "PeopleEntity38s",
  endpoint: "/people/people-entity-38",
  titleField: "name",
  permissions: { read: "people.peopleEntity38.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity39Resource = defineResource({
  name: "people-entity-39",
  labelSingular: "PeopleEntity39",
  labelPlural: "PeopleEntity39s",
  endpoint: "/people/people-entity-39",
  titleField: "name",
  permissions: { read: "people.peopleEntity39.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity40Resource = defineResource({
  name: "people-entity-40",
  labelSingular: "PeopleEntity40",
  labelPlural: "PeopleEntity40s",
  endpoint: "/people/people-entity-40",
  titleField: "name",
  permissions: { read: "people.peopleEntity40.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleEntity41Resource = defineResource({
  name: "people-entity-41",
  labelSingular: "PeopleEntity41",
  labelPlural: "PeopleEntity41s",
  endpoint: "/people/people-entity-41",
  titleField: "name",
  permissions: { read: "people.peopleEntity41.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const peopleModule = defineModule({
  id: "people",
  title: "People",
  basePath: "/people",
  permission: "people.read",
  resources: [
    peopleEntity1Resource,
    peopleEntity2Resource,
    peopleEntity3Resource,
    peopleEntity4Resource,
    peopleEntity5Resource,
    peopleEntity6Resource,
    peopleEntity7Resource,
    peopleEntity8Resource,
    peopleEntity9Resource,
    peopleEntity10Resource,
    peopleEntity11Resource,
    peopleEntity12Resource,
    peopleEntity13Resource,
    peopleEntity14Resource,
    peopleEntity15Resource,
    peopleEntity16Resource,
    peopleEntity17Resource,
    peopleEntity18Resource,
    peopleEntity19Resource,
    peopleEntity20Resource,
    peopleEntity21Resource,
    peopleEntity22Resource,
    peopleEntity23Resource,
    peopleEntity24Resource,
    peopleEntity25Resource,
    peopleEntity26Resource,
    peopleEntity27Resource,
    peopleEntity28Resource,
    peopleEntity29Resource,
    peopleEntity30Resource,
    peopleEntity31Resource,
    peopleEntity32Resource,
    peopleEntity33Resource,
    peopleEntity34Resource,
    peopleEntity35Resource,
    peopleEntity36Resource,
    peopleEntity37Resource,
    peopleEntity38Resource,
    peopleEntity39Resource,
    peopleEntity40Resource,
    peopleEntity41Resource,
  ],
});
