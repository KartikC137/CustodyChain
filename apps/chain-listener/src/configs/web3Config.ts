import { createPublicClient, http, type PublicClient, type Chain } from "viem";
import { sepolia, anvil } from "viem/chains";
import { optionalEnv } from "./envConfig";

const supportedChains: Record<number, Chain> = {
  11155111: sepolia,
  31337: anvil,
};

const publicRPCs: Record<number, string> = {
  11155111: "wss://0xrpc.io/sep",
};

const clientCache = new Map<number, PublicClient>();

export function getPublicClient(chainId: number): PublicClient {
  if (clientCache.has(chainId)) {
    console.info("config: picking chain from cache:", chainId);

    return clientCache.get(chainId)!;
  }

  console.info("config: new chain added, chain ID:", chainId);
  const chain = supportedChains[chainId];
  if (!chain) throw new Error(`config: unsupported chain ID: ${chainId}`);

  if (chainId === 31337) {
    const newClient = createPublicClient({
      chain: chain,
      transport: http(),
    });

    clientCache.set(chainId, newClient);
    return newClient;
  } else {
    const preferCustomRpc = optionalEnv(
      `${chain.name.toUpperCase().replace(/\s+/g, "_")}_RPC_URL`,
    );

    console.info("config: custom rpc not found, switching to public rpc");
    const rpcUrl = preferCustomRpc
      ? http(preferCustomRpc)
      : http(publicRPCs[chain.id]);

    const newClient = createPublicClient({
      chain: chain,
      transport: rpcUrl,
    });

    clientCache.set(chainId, newClient);
    return newClient;
  }
}
