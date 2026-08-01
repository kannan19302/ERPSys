import { defineModule, defineResource } from "@unerp/framework";

export const blockchainEntity1Resource = defineResource({
  name: "blockchain-entity-1",
  labelSingular: "BlockchainEntity1",
  labelPlural: "BlockchainEntity1s",
  endpoint: "/blockchain/blockchain-entity-1",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity1.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity2Resource = defineResource({
  name: "blockchain-entity-2",
  labelSingular: "BlockchainEntity2",
  labelPlural: "BlockchainEntity2s",
  endpoint: "/blockchain/blockchain-entity-2",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity2.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity3Resource = defineResource({
  name: "blockchain-entity-3",
  labelSingular: "BlockchainEntity3",
  labelPlural: "BlockchainEntity3s",
  endpoint: "/blockchain/blockchain-entity-3",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity3.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity4Resource = defineResource({
  name: "blockchain-entity-4",
  labelSingular: "BlockchainEntity4",
  labelPlural: "BlockchainEntity4s",
  endpoint: "/blockchain/blockchain-entity-4",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity4.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity5Resource = defineResource({
  name: "blockchain-entity-5",
  labelSingular: "BlockchainEntity5",
  labelPlural: "BlockchainEntity5s",
  endpoint: "/blockchain/blockchain-entity-5",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity5.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity6Resource = defineResource({
  name: "blockchain-entity-6",
  labelSingular: "BlockchainEntity6",
  labelPlural: "BlockchainEntity6s",
  endpoint: "/blockchain/blockchain-entity-6",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity6.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity7Resource = defineResource({
  name: "blockchain-entity-7",
  labelSingular: "BlockchainEntity7",
  labelPlural: "BlockchainEntity7s",
  endpoint: "/blockchain/blockchain-entity-7",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity7.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity8Resource = defineResource({
  name: "blockchain-entity-8",
  labelSingular: "BlockchainEntity8",
  labelPlural: "BlockchainEntity8s",
  endpoint: "/blockchain/blockchain-entity-8",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity8.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity9Resource = defineResource({
  name: "blockchain-entity-9",
  labelSingular: "BlockchainEntity9",
  labelPlural: "BlockchainEntity9s",
  endpoint: "/blockchain/blockchain-entity-9",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity9.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity10Resource = defineResource({
  name: "blockchain-entity-10",
  labelSingular: "BlockchainEntity10",
  labelPlural: "BlockchainEntity10s",
  endpoint: "/blockchain/blockchain-entity-10",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity10.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity11Resource = defineResource({
  name: "blockchain-entity-11",
  labelSingular: "BlockchainEntity11",
  labelPlural: "BlockchainEntity11s",
  endpoint: "/blockchain/blockchain-entity-11",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity11.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity12Resource = defineResource({
  name: "blockchain-entity-12",
  labelSingular: "BlockchainEntity12",
  labelPlural: "BlockchainEntity12s",
  endpoint: "/blockchain/blockchain-entity-12",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity12.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity13Resource = defineResource({
  name: "blockchain-entity-13",
  labelSingular: "BlockchainEntity13",
  labelPlural: "BlockchainEntity13s",
  endpoint: "/blockchain/blockchain-entity-13",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity13.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity14Resource = defineResource({
  name: "blockchain-entity-14",
  labelSingular: "BlockchainEntity14",
  labelPlural: "BlockchainEntity14s",
  endpoint: "/blockchain/blockchain-entity-14",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity14.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity15Resource = defineResource({
  name: "blockchain-entity-15",
  labelSingular: "BlockchainEntity15",
  labelPlural: "BlockchainEntity15s",
  endpoint: "/blockchain/blockchain-entity-15",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity15.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity16Resource = defineResource({
  name: "blockchain-entity-16",
  labelSingular: "BlockchainEntity16",
  labelPlural: "BlockchainEntity16s",
  endpoint: "/blockchain/blockchain-entity-16",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity16.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity17Resource = defineResource({
  name: "blockchain-entity-17",
  labelSingular: "BlockchainEntity17",
  labelPlural: "BlockchainEntity17s",
  endpoint: "/blockchain/blockchain-entity-17",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity17.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity18Resource = defineResource({
  name: "blockchain-entity-18",
  labelSingular: "BlockchainEntity18",
  labelPlural: "BlockchainEntity18s",
  endpoint: "/blockchain/blockchain-entity-18",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity18.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity19Resource = defineResource({
  name: "blockchain-entity-19",
  labelSingular: "BlockchainEntity19",
  labelPlural: "BlockchainEntity19s",
  endpoint: "/blockchain/blockchain-entity-19",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity19.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity20Resource = defineResource({
  name: "blockchain-entity-20",
  labelSingular: "BlockchainEntity20",
  labelPlural: "BlockchainEntity20s",
  endpoint: "/blockchain/blockchain-entity-20",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity20.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity21Resource = defineResource({
  name: "blockchain-entity-21",
  labelSingular: "BlockchainEntity21",
  labelPlural: "BlockchainEntity21s",
  endpoint: "/blockchain/blockchain-entity-21",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity21.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity22Resource = defineResource({
  name: "blockchain-entity-22",
  labelSingular: "BlockchainEntity22",
  labelPlural: "BlockchainEntity22s",
  endpoint: "/blockchain/blockchain-entity-22",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity22.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity23Resource = defineResource({
  name: "blockchain-entity-23",
  labelSingular: "BlockchainEntity23",
  labelPlural: "BlockchainEntity23s",
  endpoint: "/blockchain/blockchain-entity-23",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity23.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity24Resource = defineResource({
  name: "blockchain-entity-24",
  labelSingular: "BlockchainEntity24",
  labelPlural: "BlockchainEntity24s",
  endpoint: "/blockchain/blockchain-entity-24",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity24.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity25Resource = defineResource({
  name: "blockchain-entity-25",
  labelSingular: "BlockchainEntity25",
  labelPlural: "BlockchainEntity25s",
  endpoint: "/blockchain/blockchain-entity-25",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity25.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity26Resource = defineResource({
  name: "blockchain-entity-26",
  labelSingular: "BlockchainEntity26",
  labelPlural: "BlockchainEntity26s",
  endpoint: "/blockchain/blockchain-entity-26",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity26.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity27Resource = defineResource({
  name: "blockchain-entity-27",
  labelSingular: "BlockchainEntity27",
  labelPlural: "BlockchainEntity27s",
  endpoint: "/blockchain/blockchain-entity-27",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity27.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity28Resource = defineResource({
  name: "blockchain-entity-28",
  labelSingular: "BlockchainEntity28",
  labelPlural: "BlockchainEntity28s",
  endpoint: "/blockchain/blockchain-entity-28",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity28.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity29Resource = defineResource({
  name: "blockchain-entity-29",
  labelSingular: "BlockchainEntity29",
  labelPlural: "BlockchainEntity29s",
  endpoint: "/blockchain/blockchain-entity-29",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity29.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity30Resource = defineResource({
  name: "blockchain-entity-30",
  labelSingular: "BlockchainEntity30",
  labelPlural: "BlockchainEntity30s",
  endpoint: "/blockchain/blockchain-entity-30",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity30.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity31Resource = defineResource({
  name: "blockchain-entity-31",
  labelSingular: "BlockchainEntity31",
  labelPlural: "BlockchainEntity31s",
  endpoint: "/blockchain/blockchain-entity-31",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity31.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity32Resource = defineResource({
  name: "blockchain-entity-32",
  labelSingular: "BlockchainEntity32",
  labelPlural: "BlockchainEntity32s",
  endpoint: "/blockchain/blockchain-entity-32",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity32.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity33Resource = defineResource({
  name: "blockchain-entity-33",
  labelSingular: "BlockchainEntity33",
  labelPlural: "BlockchainEntity33s",
  endpoint: "/blockchain/blockchain-entity-33",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity33.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity34Resource = defineResource({
  name: "blockchain-entity-34",
  labelSingular: "BlockchainEntity34",
  labelPlural: "BlockchainEntity34s",
  endpoint: "/blockchain/blockchain-entity-34",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity34.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity35Resource = defineResource({
  name: "blockchain-entity-35",
  labelSingular: "BlockchainEntity35",
  labelPlural: "BlockchainEntity35s",
  endpoint: "/blockchain/blockchain-entity-35",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity35.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity36Resource = defineResource({
  name: "blockchain-entity-36",
  labelSingular: "BlockchainEntity36",
  labelPlural: "BlockchainEntity36s",
  endpoint: "/blockchain/blockchain-entity-36",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity36.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity37Resource = defineResource({
  name: "blockchain-entity-37",
  labelSingular: "BlockchainEntity37",
  labelPlural: "BlockchainEntity37s",
  endpoint: "/blockchain/blockchain-entity-37",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity37.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity38Resource = defineResource({
  name: "blockchain-entity-38",
  labelSingular: "BlockchainEntity38",
  labelPlural: "BlockchainEntity38s",
  endpoint: "/blockchain/blockchain-entity-38",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity38.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity39Resource = defineResource({
  name: "blockchain-entity-39",
  labelSingular: "BlockchainEntity39",
  labelPlural: "BlockchainEntity39s",
  endpoint: "/blockchain/blockchain-entity-39",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity39.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity40Resource = defineResource({
  name: "blockchain-entity-40",
  labelSingular: "BlockchainEntity40",
  labelPlural: "BlockchainEntity40s",
  endpoint: "/blockchain/blockchain-entity-40",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity40.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainEntity41Resource = defineResource({
  name: "blockchain-entity-41",
  labelSingular: "BlockchainEntity41",
  labelPlural: "BlockchainEntity41s",
  endpoint: "/blockchain/blockchain-entity-41",
  titleField: "name",
  permissions: { read: "blockchain.blockchainEntity41.read" },
  fields: [
    { name: "id", label: "ID", type: "text", readOnly: true },
    { name: "name", label: "Name", type: "text" },
  ],
  list: { columns: ["id", "name"], searchable: true, pageSize: 20 },
});

export const blockchainModule = defineModule({
  id: "blockchain",
  title: "Blockchain",
  basePath: "/blockchain",
  permission: "blockchain.read",
  resources: [
    blockchainEntity1Resource,
    blockchainEntity2Resource,
    blockchainEntity3Resource,
    blockchainEntity4Resource,
    blockchainEntity5Resource,
    blockchainEntity6Resource,
    blockchainEntity7Resource,
    blockchainEntity8Resource,
    blockchainEntity9Resource,
    blockchainEntity10Resource,
    blockchainEntity11Resource,
    blockchainEntity12Resource,
    blockchainEntity13Resource,
    blockchainEntity14Resource,
    blockchainEntity15Resource,
    blockchainEntity16Resource,
    blockchainEntity17Resource,
    blockchainEntity18Resource,
    blockchainEntity19Resource,
    blockchainEntity20Resource,
    blockchainEntity21Resource,
    blockchainEntity22Resource,
    blockchainEntity23Resource,
    blockchainEntity24Resource,
    blockchainEntity25Resource,
    blockchainEntity26Resource,
    blockchainEntity27Resource,
    blockchainEntity28Resource,
    blockchainEntity29Resource,
    blockchainEntity30Resource,
    blockchainEntity31Resource,
    blockchainEntity32Resource,
    blockchainEntity33Resource,
    blockchainEntity34Resource,
    blockchainEntity35Resource,
    blockchainEntity36Resource,
    blockchainEntity37Resource,
    blockchainEntity38Resource,
    blockchainEntity39Resource,
    blockchainEntity40Resource,
    blockchainEntity41Resource,
  ],
});
