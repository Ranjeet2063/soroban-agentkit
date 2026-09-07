import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export function createGetBalanceTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'stellar_get_balance',
    description: 'Fetch the native XLM and asset balances for a Stellar/Soroban account address.',
    parameters: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The Stellar public key (starting with G...) to check balances for. If omitted, checks the agent\'s own address.'
        }
      },
      required: []
    },
    execute: async (params: { accountId?: string }): Promise<ToolExecutionResult> => {
      try {
        const targetAddress = params.accountId || agent.getPublicKey();
        const balances = await agent.getBalances(targetAddress);
        return {
          success: true,
          data: {
            accountId: targetAddress,
            balances
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
