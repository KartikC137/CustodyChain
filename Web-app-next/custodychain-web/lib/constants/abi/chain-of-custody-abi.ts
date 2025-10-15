export const evidenceAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_evidenceLedgerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_evidenceId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "_creator",
        type: "address",
        internalType: "address",
      },
      {
        name: "_initialOwner",
        type: "address",
        internalType: "address",
      },
      {
        name: "_description",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "discontinueEvidence",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getChainOfCustody",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentOwner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEvidenceCreator",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEvidenceDescription",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEvidenceState",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getevidenceId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "EvindenceDiscontinued",
    inputs: [
      {
        name: "evidenceId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "CallerIsNotCurrentOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "caller",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "CreatorIsNotInitialOwner",
    inputs: [
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedDeployment",
    inputs: [
      {
        name: "caller",
        type: "address",
        internalType: "address",
      },
    ],
  },
];
