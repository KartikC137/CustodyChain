import { CustodyRecord } from "../lib/types/evidence.types.js";
import { Address } from "../lib/types/solidity.types.js";

/**
 * @notice AI generated, need to check later
 * @param rawChainOfCustody
 * @returns custody record object/ unique owners
 */
export const parseChainOfCustody = (rawChainOfCustody: string) => {
  if (!rawChainOfCustody || rawChainOfCustody === "{}") return [];

  /**
   * REGEX EXPLANATION:
   * \((0x[a-fA-F0-9]+)  -> Match '(' followed by ETH address (Group 1)
   * ,                   -> Match the comma separator
   * (\d+)               -> Match one or more DIGITS (Group 2) - No quotes!
   * \)                  -> Match closing ')'
   */
  const regex = /\((0x[a-fA-F0-9]+),(\d+)\)/g;
  const matches = [...rawChainOfCustody.matchAll(regex)];
  return matches.map((match) => {
    return {
      owner: match[1],
      timestamp: BigInt(match[2]),
    };
  }) as CustodyRecord[];
};

// ignores the repeating owners
export const parseUniqueOwners = (rawChainOfCustody: string): Address[] => {
  if (!rawChainOfCustody || rawChainOfCustody === "{}") return [];

  const regex = /\((0x[a-fA-F0-9]+),(\d+)\)/g;
  const matches = [...rawChainOfCustody.matchAll(regex)];
  const uniqueOwners = new Set<Address>();

  for (const match of matches) {
    uniqueOwners.add(match[1] as Address);
  }
  return Array.from(uniqueOwners);
};
