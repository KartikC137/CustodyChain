export const evidenceLedgerAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "createEvidence",
    inputs: [
      {
        name: "metadataHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      { name: "description", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCreatorNonce",
    inputs: [{ name: "creator", type: "address", internalType: "address" }],
    outputs: [{ name: "nonce", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEvidenceContractAddress",
    inputs: [{ name: "evidenceId", type: "bytes32", internalType: "bytes32" }],
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
    type: "event",
    name: "EvidenceCreated",
    inputs: [
      {
        name: "contractAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
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
        name: "metadataHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "nonce",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "EvidenceLedgerCreated",
    inputs: [
      {
        name: "contractAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "blockNumber",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "timeStamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
];
