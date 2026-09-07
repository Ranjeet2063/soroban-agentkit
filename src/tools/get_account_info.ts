import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export function createGetAccountInfoTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'stellar_get_account_info',
    description: 'Retrieve detailed ledger metadata, sequence number, subentry count, and signers for an account.',
    parameters: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The Stellar public key. If omitted, queries the agent\'s own address.'
        }
      },
      required: []
    },
    execute: async (params: { accountId?: string }): Promise<ToolExecutionResult> => {
      try {
        const targetAddress = params.accountId || agent.getPublicKey();
        const info = await agent.getAccountInfo(targetAddress);
        return {
          success: true,
          data: info
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
