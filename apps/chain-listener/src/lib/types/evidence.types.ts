import { Address, Bytes32 } from "./solidity.types.js";

// this is type is different from client side
export interface SocketEvidenceDetails {
  id: Bytes32;
  status: "active" | "discontinued";
  description: string;
  creator: Address;
  currentOwner: Address;
  createdAt: string;
  transferredAt: string;
  discontinuedAt?: string;
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
