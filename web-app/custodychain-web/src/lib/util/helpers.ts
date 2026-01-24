import { AddressSchema, Bytes32Schema } from "../types/solidity.types";

export const formatTimestamp = (rawTimeStamp: bigint) => {
  if (rawTimeStamp === 0n) return "N/A";
  const date = new Date(Number(rawTimeStamp) * 1000);
  return date.toLocaleString();
};

export const parseChainOfCustody = (rawChainOfCustody: string) => {
  // 1. Handle empty/null
  if (!rawChainOfCustody || rawChainOfCustody === "{}") return [];

  /**
   * REGEX EXPLANATION:
   * \((0x[a-fA-F0-9]+)  -> Match '(' followed by ETH address (Group 1)
   * ,                   -> Match the comma separator
   * (\d+)               -> Match one or more DIGITS (Group 2) - No quotes!
   * \)                  -> Match closing ')'
   */
  const regex = /\((0x[a-fA-F0-9]+),(\d+)\)/g;

  // 2. Extract matches
  const matches = [...rawChainOfCustody.matchAll(regex)];

  // 3. Map to object
  return matches.map((match) => {
    return {
      owner: match[1],
      // Convert the string digit to a native BigInt (or Number if safe)
      timestamp: BigInt(match[2]),
    };
  });
};

export function validHashCheck(hash: string, text: "Metadata Hash" | "ID") {
  const result = Bytes32Schema.safeParse(hash);
  if (hash === "") {
    return `Enter Evidence ${text}`;
  } else if (!hash.startsWith("0x")) {
    return `${text} must begin with "0x..."`;
  } else if (hash.length !== 66) {
    return `${text} Must be 66 characters long`;
  } else if (!result.success) {
    return `Invalid characters in hash detected! Check the ${text}`;
  } else {
    return "valid";
  }
}

export function validAddressCheck(address: string) {
  const result = AddressSchema.safeParse(address);
  if (address === "") {
    return `Enter New Owner address`;
  } else if (!address.startsWith("0x")) {
    return `Address must begin with "0x..."`;
  } else if (address.length !== 42) {
    return `Address Must be 42 characters long`;
  } else if (!result.success) {
    return `Invalid characters in Address detected!`;
  } else {
    return "valid";
  }
}
// if there is a need to limit desc
export function isValidDesc(desc: string) {
  if (desc === "") return false;
  return true;
}
