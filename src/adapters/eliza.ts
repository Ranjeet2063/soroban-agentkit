import type { SorobanAgentKit } from '../agent.js';

export interface ElizaActionExample {
  user: string;
  content: {
    text: string;
    action?: string;
    [key: string]: any;
  };
}

export interface ElizaAction {
  name: string;
  similes: string[];
  description: string;
  validate: (runtime: any, message: any, state?: any) => Promise<boolean>;
  handler: (runtime: any, message: any, state?: any, options?: any, callback?: any) => Promise<boolean | any>;
  examples: ElizaActionExample[][];
}

export interface ElizaPlugin {
  name: string;
  description: string;
  actions: ElizaAction[];
}

/**
 * Converts SorobanAgentKit tools into ElizaOS action format.
 */
export function toElizaActions(agent: SorobanAgentKit): ElizaAction[] {
  const checkBalanceAction: ElizaAction = {
    name: 'STELLAR_CHECK_BALANCE',
    similes: [
      'CHECK_XLM_BALANCE',
      'GET_STELLAR_BALANCE',
      'SHOW_SOROBAN_BALANCE',
      'WALLET_BALANCE',
      'GET_BALANCE'
    ],
    description: 'Check native XLM and token balances for an address or the agent wallet on Stellar/Soroban.',
    validate: async (_runtime: any, _message: any): Promise<boolean> => {
      return Boolean(agent && agent.getPublicKey());
    },
    handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any): Promise<any> => {
      try {
        const text = message?.content?.text || '';
        const match = text.match(/G[A-Z0-9]{55}/);
        const targetAddress = match ? match[0] : agent.getPublicKey();
        const balances = await agent.getBalances(targetAddress);
        const result = {
          success: true,
          address: targetAddress,
          balances
        };
        if (callback) {
          await callback({
            text: `Balances for ${targetAddress}: ${balances.map(b => `${b.balance} ${b.asset}`).join(', ')}`,
            content: result
          });
        }
        return result;
      } catch (err: any) {
        if (callback) {
          await callback({ text: `Failed to check balance: ${err?.message || err}`, error: true });
        }
        return false;
      }
    },
    examples: [
      [
        { user: 'user', content: { text: 'What is my Stellar wallet balance?' } },
        { user: 'agent', content: { text: 'Checking your Stellar balances...', action: 'STELLAR_CHECK_BALANCE' } }
      ]
    ]
  };

  const transferTokenAction: ElizaAction = {
    name: 'STELLAR_TRANSFER_TOKEN',
    similes: [
      'SEND_XLM',
      'TRANSFER_STELLAR_TOKEN',
      'PAY_STELLAR',
      'SEND_PAYMENT'
    ],
    description: 'Send native XLM or issued tokens to a destination address on Stellar network.',
    validate: async (_runtime: any, _message: any): Promise<boolean> => {
      return Boolean(agent && agent.getKeypair());
    },
    handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any): Promise<any> => {
      try {
        const text = message?.content?.text || '';
        const destMatch = text.match(/G[A-Z0-9]{55}/);
        const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:XLM|tokens)?/i);

        if (!destMatch || !amountMatch) {
          throw new Error('Destination address or amount could not be parsed from message.');
        }

        const destination = destMatch[0];
        const amount = amountMatch[1];
        const res = await agent.transferPayment({ destination, amount });

        if (callback) {
          await callback({
            text: `Successfully transferred ${amount} XLM to ${destination}.`,
            content: res
          });
        }
        return res;
      } catch (err: any) {
        if (callback) {
          await callback({ text: `Failed to transfer token: ${err?.message || err}`, error: true });
        }
        return false;
      }
    },
    examples: [
      [
        { user: 'user', content: { text: 'Send 10 XLM to GBCXX...' } },
        { user: 'agent', content: { text: 'Initiating transfer of 10 XLM...', action: 'STELLAR_TRANSFER_TOKEN' } }
      ]
    ]
  };

  return [checkBalanceAction, transferTokenAction];
}

/**
 * Creates an ElizaOS plugin wrapper for SorobanAgentKit.
 */
export function toElizaPlugin(agent: SorobanAgentKit): ElizaPlugin {
  return {
    name: 'soroban-agentkit-plugin',
    description: 'ElizaOS plugin providing native Stellar and Soroban blockchain actions.',
    actions: toElizaActions(agent)
  };
}
