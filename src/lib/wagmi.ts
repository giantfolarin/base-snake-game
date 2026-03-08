import { createConfig, http } from "wagmi";
import { base } from "viem/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({ appName: "SnakeBase" }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
});
