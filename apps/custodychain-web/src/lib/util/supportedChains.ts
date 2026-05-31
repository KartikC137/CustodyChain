import { anvil, Chain, sepolia } from "viem/chains";

export const supportedChains: Record<number, Chain> = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
};
