import { encodeFunctionData } from "viem";

export const CONTRACT_ADDRESS = "0xB9e2D368Cc09ad609Dc29606d88F6ac67F0132Cd" as const;

// Builder code bc_4ecjsrzu encoded as UTF-8 hex
const BUILDER_CODE_HEX = "62635f3465636a73727a75";

export const CONTRACT_ABI = [
  {
    name: "submitScore",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name",  type: "string"  },
      { name: "score", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getTopScores",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "player",    type: "address" },
          { name: "name",      type: "string"  },
          { name: "score",     type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
] as const;

/** Returns calldata for submitScore with the builder attribution suffix appended. */
export function encodeSubmitScore(name: string, score: number): `0x${string}` {
  const encoded = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: "submitScore",
    args: [name, BigInt(score)],
  });
  return `${encoded}${BUILDER_CODE_HEX}` as `0x${string}`;
}
