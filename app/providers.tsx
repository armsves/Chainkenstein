"use client";

import { FC, PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { Chain, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Configure chains and RPC URLs.
export const supportedChains = [mainnet, sepolia, base] as [
  Chain,
  ...Chain[],
];

const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

// Add this type for the Providers props
type ProvidersProps = PropsWithChildren<{
  onSessionEnd?: () => void;
}>;

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID || ""} initialChain={baseSepolia}>
          <MiniKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={baseSepolia}
            config={{
              appearance: {
                mode: "auto",
                theme: "mini-app-theme",
                name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
                logo: process.env.NEXT_PUBLIC_ICON_URL,
              },
            }}
          >
            {children}
          </MiniKitProvider>
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};
