export const evidenceLedgerAddress = "";
export const evidenceLedgerAbi = [
  {
    type: "function",
    name: "createEvidence",
    inputs: [
      {
        name: "evidenceId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "description",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEvidenceContractAddress",
    inputs: [
      {
        name: "evidenceId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "evidenceContractAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEvidenceLedgerStatus",
    inputs: [],
    outputs: [
      {
        name: "evidenceLedgerCreated",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getEvidencesCreatedByCreator",
    inputs: [
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "evidenceIds",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "EvidenceCreated",
    inputs: [
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "evidenceId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "description",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
];
