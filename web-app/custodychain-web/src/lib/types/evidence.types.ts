import { Address, Bytes32 } from "./solidity.types";

export type primaryFilterType = "all" | "active" | "discontinued";
export type secondaryFilterType = "all" | "created" | "owned";
export interface EvidenceDetailsSummary {
  id: Bytes32;
  isActive: boolean;
  description: string;
  creator: Address;
  timeOfCreation: bigint;
  currentOwner: Address;
  currentOwnerTime: bigint;
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
