// @ts-nocheck
import { defineModule, defineResource } from "@unerp/framework";

export const reportingEntity1Resource = defineResource({
  name: "reporting-entity-1",
  labelSingular: "ReportingEntity1",
  labelPlural: "ReportingEntity1s",
  endpoint: "/reporting/reporting-entity-1",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity2Resource = defineResource({
  name: "reporting-entity-2",
  labelSingular: "ReportingEntity2",
  labelPlural: "ReportingEntity2s",
  endpoint: "/reporting/reporting-entity-2",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity3Resource = defineResource({
  name: "reporting-entity-3",
  labelSingular: "ReportingEntity3",
  labelPlural: "ReportingEntity3s",
  endpoint: "/reporting/reporting-entity-3",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity4Resource = defineResource({
  name: "reporting-entity-4",
  labelSingular: "ReportingEntity4",
  labelPlural: "ReportingEntity4s",
  endpoint: "/reporting/reporting-entity-4",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity5Resource = defineResource({
  name: "reporting-entity-5",
  labelSingular: "ReportingEntity5",
  labelPlural: "ReportingEntity5s",
  endpoint: "/reporting/reporting-entity-5",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity6Resource = defineResource({
  name: "reporting-entity-6",
  labelSingular: "ReportingEntity6",
  labelPlural: "ReportingEntity6s",
  endpoint: "/reporting/reporting-entity-6",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity7Resource = defineResource({
  name: "reporting-entity-7",
  labelSingular: "ReportingEntity7",
  labelPlural: "ReportingEntity7s",
  endpoint: "/reporting/reporting-entity-7",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity8Resource = defineResource({
  name: "reporting-entity-8",
  labelSingular: "ReportingEntity8",
  labelPlural: "ReportingEntity8s",
  endpoint: "/reporting/reporting-entity-8",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity9Resource = defineResource({
  name: "reporting-entity-9",
  labelSingular: "ReportingEntity9",
  labelPlural: "ReportingEntity9s",
  endpoint: "/reporting/reporting-entity-9",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity10Resource = defineResource({
  name: "reporting-entity-10",
  labelSingular: "ReportingEntity10",
  labelPlural: "ReportingEntity10s",
  endpoint: "/reporting/reporting-entity-10",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity11Resource = defineResource({
  name: "reporting-entity-11",
  labelSingular: "ReportingEntity11",
  labelPlural: "ReportingEntity11s",
  endpoint: "/reporting/reporting-entity-11",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity12Resource = defineResource({
  name: "reporting-entity-12",
  labelSingular: "ReportingEntity12",
  labelPlural: "ReportingEntity12s",
  endpoint: "/reporting/reporting-entity-12",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity13Resource = defineResource({
  name: "reporting-entity-13",
  labelSingular: "ReportingEntity13",
  labelPlural: "ReportingEntity13s",
  endpoint: "/reporting/reporting-entity-13",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity14Resource = defineResource({
  name: "reporting-entity-14",
  labelSingular: "ReportingEntity14",
  labelPlural: "ReportingEntity14s",
  endpoint: "/reporting/reporting-entity-14",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity15Resource = defineResource({
  name: "reporting-entity-15",
  labelSingular: "ReportingEntity15",
  labelPlural: "ReportingEntity15s",
  endpoint: "/reporting/reporting-entity-15",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity16Resource = defineResource({
  name: "reporting-entity-16",
  labelSingular: "ReportingEntity16",
  labelPlural: "ReportingEntity16s",
  endpoint: "/reporting/reporting-entity-16",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingEntity17Resource = defineResource({
  name: "reporting-entity-17",
  labelSingular: "ReportingEntity17",
  labelPlural: "ReportingEntity17s",
  endpoint: "/reporting/reporting-entity-17",
  titleField: "name",
  permissions: { read: "reporting.reportingEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const reportingModule = defineModule({
  id: "reporting",
  title: "Reporting",
  basePath: "/reporting",
  permission: "reporting.read",
  resources: [
    reportingEntity1Resource,
    reportingEntity2Resource,
    reportingEntity3Resource,
    reportingEntity4Resource,
    reportingEntity5Resource,
    reportingEntity6Resource,
    reportingEntity7Resource,
    reportingEntity8Resource,
    reportingEntity9Resource,
    reportingEntity10Resource,
    reportingEntity11Resource,
    reportingEntity12Resource,
    reportingEntity13Resource,
    reportingEntity14Resource,
    reportingEntity15Resource,
    reportingEntity16Resource,
    reportingEntity17Resource,
  ],
});
