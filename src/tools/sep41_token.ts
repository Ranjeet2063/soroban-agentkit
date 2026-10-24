import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export function createSep41TokenTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'soroban_sep41_token',
    description: 'Interact with standard Soroban SEP-0041 Token contracts (balance, transfer, allowance, approve).',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'The SEP-0041 token smart contract ID (starting with C...)'
        },
        action: {
          type: 'string',
          enum: ['balance', 'transfer', 'allowance', 'approve'],
          description: 'The SEP-0041 standard token operation to perform'
        },
        id: {
          type: 'string',
          description: 'Account address to query balance for (defaults to agent address)'
        },
        from: {
          type: 'string',
          description: 'Sender account address (defaults to agent address)'
        },
        to: {
          type: 'string',
          description: 'Recipient account address for transfer'
        },
        spender: {
          type: 'string',
          description: 'Spender account address for allowance or approve'
        },
        amount: {
          type: 'string',
          description: 'Token amount integer in i128 format (e.g. "10000000")'
        },
        expirationLedger: {
          type: 'number',
          description: 'Expiration ledger sequence for approve allowance'
        }
      },
      required: ['contractId', 'action']
    },
    execute: async (params: {
      contractId: string;
      action: 'balance' | 'transfer' | 'allowance' | 'approve';
      id?: string;
      from?: string;
      to?: string;
      spender?: string;
      amount?: string;
      expirationLedger?: number;
    }): Promise<ToolExecutionResult> => {
      try {
        const { contractId, action } = params;
        if (!contractId) {
          throw new Error('contractId is required');
        }

        switch (action) {
          case 'balance': {
            const targetId = params.id || agent.getPublicKey();
            const res = await agent.invokeContract({
              contractId,
              method: 'balance',
              args: [targetId],
              simulateOnly: true
            });
            return {
              success: true,
              data: {
                contractId,
                action: 'balance',
                id: targetId,
                result: res
              }
            };
          }
          case 'transfer': {
            const from = params.from || agent.getPublicKey();
            const to = params.to;
            const amount = params.amount || '0';
            if (!to) {
              throw new Error('Recipient "to" address is required for transfer');
            }
            const res = await agent.invokeContract({
              contractId,
              method: 'transfer',
              args: [from, to, amount]
            });
            return {
              success: true,
              data: {
                contractId,
                action: 'transfer',
                from,
                to,
                amount,
                result: res
              },
              txHash: res?.txHash
            };
          }
          case 'allowance': {
            const from = params.from || agent.getPublicKey();
            const spender = params.spender;
            if (!spender) {
              throw new Error('Spender address is required for allowance check');
            }
            const res = await agent.invokeContract({
              contractId,
              method: 'allowance',
              args: [from, spender],
              simulateOnly: true
            });
            return {
              success: true,
              data: {
                contractId,
                action: 'allowance',
                from,
                spender,
                result: res
              }
            };
          }
          case 'approve': {
            const from = params.from || agent.getPublicKey();
            const spender = params.spender;
            const amount = params.amount || '0';
            const expirationLedger = params.expirationLedger || 1000000;
            if (!spender) {
              throw new Error('Spender address is required for approve');
            }
            const res = await agent.invokeContract({
              contractId,
              method: 'approve',
              args: [from, spender, amount, expirationLedger]
            });
            return {
              success: true,
              data: {
                contractId,
                action: 'approve',
                from,
                spender,
                amount,
                expirationLedger,
                result: res
              },
              txHash: res?.txHash
            };
          }
          default:
            throw new Error(`Unsupported SEP-0041 action: ${action}`);
        }
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || String(err)
        };
      }
    }
  };
}
