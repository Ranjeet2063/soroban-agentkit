import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export function createTransferTokenTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'stellar_transfer_token',
    description: 'Transfer native XLM or assets to a recipient Stellar address.',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Recipient Stellar public key starting with G...'
        },
        amount: {
          type: 'string',
          description: 'Amount of tokens to send (e.g. "10.5")'
        },
        assetCode: {
          type: 'string',
          description: 'Asset code to send. Defaults to "XLM" (native).'
        },
        memo: {
          type: 'string',
          description: 'Optional transaction text memo (up to 28 bytes).'
        }
      },
      required: ['destination', 'amount']
    },
    execute: async (params: { destination: string; amount: string; assetCode?: string; memo?: string }): Promise<ToolExecutionResult> => {
      try {
        const result = await agent.transferPayment({
          destination: params.destination,
          amount: params.amount,
          assetCode: params.assetCode || 'XLM',
          memo: params.memo
        });
        return {
          success: true,
          txHash: result.hash,
          data: {
            destination: params.destination,
            amount: params.amount,
            asset: params.assetCode || 'XLM',
            txHash: result.hash
          }
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || String(err)
        };
      }
    }
  };
}
