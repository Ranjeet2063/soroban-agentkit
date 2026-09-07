import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export function createCallContractTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'soroban_call_contract',
    description: 'Simulate or execute an invocation on a Soroban smart contract.',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'The C... 56-character contract address.'
        },
        method: {
          type: 'string',
          description: 'The smart contract function name to invoke.'
        },
        args: {
          type: 'array',
          description: 'Positional arguments to pass to the function.'
        },
        simulateOnly: {
          type: 'boolean',
          description: 'If true, only performs read-only simulation without submitting a signed transaction.'
        }
      },
      required: ['contractId', 'method']
    },
    execute: async (params: { contractId: string; method: string; args?: any[]; simulateOnly?: boolean }): Promise<ToolExecutionResult> => {
      try {
        const result = await agent.invokeContract({
          contractId: params.contractId,
          method: params.method,
          args: params.args || [],
          simulateOnly: params.simulateOnly ?? false
        });
        return {
          success: true,
          data: result
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
