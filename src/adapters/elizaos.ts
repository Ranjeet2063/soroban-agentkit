import type { SorobanAgentKit } from '../agent.js';

export interface ElizaAction {
  name: string;
  similes: string[];
  description: string;
  validate: (runtime: any, message: any, state?: any) => Promise<boolean>;
  handler: (runtime: any, message: any, state?: any, options?: any, callback?: any) => Promise<any>;
  examples: any[][];
}

export interface ElizaPlugin {
  name: string;
  description: string;
  actions: ElizaAction[];
  providers: any[];
}

/**
 * Creates an ElizaOS-compatible plugin providing Stellar and Soroban actions.
 */
export function createElizaPlugin(agent: SorobanAgentKit): ElizaPlugin {
  const checkBalanceAction: ElizaAction = {
    name: 'STELLAR_CHECK_BALANCE',
    similes: ['CHECK_XLM_BALANCE', 'GET_WALLET_BALANCE', 'STELLAR_BALANCE'],
    description: 'Check the XLM or SEP-0041 token balances for the agent or target Stellar address.',
    validate: async () => true,
    handler: async (_runtime, message, _state, _options, callback) => {
      try {
        const address = message?.content?.address || agent.getPublicKey();
        const balances = await agent.getBalances(address);
        const text = `Balances for ${address}:\n` + balances.map(b => `- ${b.asset}: ${b.balance}`).join('\n');
        if (callback) callback({ text, content: { balances } });
        return { success: true, balances };
      } catch (err: any) {
        if (callback) callback({ text: `Failed to fetch balances: ${err?.message || err}` });
        return { success: false, error: err?.message || String(err) };
      }
    },
    examples: [
      [
        { user: 'user', content: { text: 'What is my Stellar wallet balance?' } },
        { user: 'agent', content: { text: 'Checking your Stellar balances...', action: 'STELLAR_CHECK_BALANCE' } }
      ]
    ]
  };

  const transferAction: ElizaAction = {
    name: 'STELLAR_TRANSFER_TOKEN',
    similes: ['SEND_XLM', 'STELLAR_PAYMENT', 'SEND_STELLAR_TOKEN'],
    description: 'Send native XLM or a Stellar asset payment to a recipient address.',
    validate: async (_runtime, message) => {
      return Boolean(message?.content?.destination && message?.content?.amount);
    },
    handler: async (_runtime, message, _state, _options, callback) => {
      try {
        const { destination, amount, assetCode, memo } = message.content;
        const res = await agent.transferPayment({ destination, amount, assetCode, memo });
        const text = `Successfully sent ${amount} ${assetCode || 'XLM'} to ${destination}. Hash: ${res.hash}`;
        if (callback) callback({ text, content: { hash: res.hash } });
        return { success: true, hash: res.hash };
      } catch (err: any) {
        if (callback) callback({ text: `Payment failed: ${err?.message || err}` });
        return { success: false, error: err?.message || String(err) };
      }
    },
    examples: [
      [
        { user: 'user', content: { text: 'Send 10 XLM to GAHK7WOOGYWWINGJVKTGOGNOW237ST5UTVK2KCTCH5QPOKTGOGNOXYZ' } },
        { user: 'agent', content: { text: 'Processing transfer...', action: 'STELLAR_TRANSFER_TOKEN' } }
      ]
    ]
  };

  return {
    name: 'stellar-agentkit',
    description: 'Stellar & Soroban AI Agent actions for ElizaOS',
    actions: [checkBalanceAction, transferAction],
    providers: []
  };
}
