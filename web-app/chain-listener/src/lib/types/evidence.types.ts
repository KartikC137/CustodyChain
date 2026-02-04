import { Address, Bytes32 } from "./solidity.types.js";

// create schemas with transformations later
export interface SocketEvidenceDetails {
  id: Bytes32;
  status: "active" | "discontinued";
  description: string;
  creator: Address;
  createdAt: string;
  currentOwner: Address;
}

export interface CustodyRecord {
  owner: Address;
  timestamp: bigint;
}

export interface EvidenceDetails {
  id: Bytes32;
  contractAddress: Address;
  creator: Address;
  timeOfCreation: bigint;
  currentOwner: Address;
  description: string;
  chainOfCustody: CustodyRecord[];
  isActive: boolean;
  timeOfDiscontinuation: bigint;
}
