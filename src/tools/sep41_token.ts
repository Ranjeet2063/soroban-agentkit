import * as StellarSdk from '@stellar/stellar-sdk';
import { AgentTool, ToolExecutionResult } from '../types.js';
import type { SorobanAgentKit } from '../agent.js';

export interface Sep41TokenParams {
  contractId: string;
  action: 'balance' | 'transfer' | 'allowance' | 'approve';
  id?: string;
  to?: string;
  spender?: string;
  amount?: string;
  expirationLedger?: number;
  simulateOnly?: boolean;
}

export function createSep41TokenTool(agent: SorobanAgentKit): AgentTool {
  return {
    name: 'soroban_sep41_token',
    description: 'Execute standard SEP-0041 token operations: balance, transfer, allowance, and approve on Soroban.',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'The C... 56-character Soroban token contract address.'
        },
        action: {
          type: 'string',
          enum: ['balance', 'transfer', 'allowance', 'approve'],
          description: 'SEP-0041 method to execute.'
        },
        id: {
          type: 'string',
          description: 'Account address to query balance for (defaults to agent public key).'
        },
        to: {
          type: 'string',
          description: 'Recipient account address for transfer.'
        },
        spender: {
          type: 'string',
          description: 'Authorized spender account address for allowance or approve.'
        },
        amount: {
          type: 'string',
          description: 'Amount in token base units (as a string to preserve precision).'
        },
        expirationLedger: {
          type: 'number',
          description: 'Target ledger sequence number when allowance expires (for approve).'
        },
        simulateOnly: {
          type: 'boolean',
          description: 'If true, dry-runs the invocation via simulation without committing to the network.'
        }
      },
      required: ['contractId', 'action']
    },
    execute: async (params: Sep41TokenParams): Promise<ToolExecutionResult> => {
      try {
        const callerAddress = agent.getPublicKey();
        const contract = new StellarSdk.Contract(params.contractId);
        let scArgs: StellarSdk.xdr.ScVal[] = [];

        switch (params.action) {
          case 'balance': {
            const target = params.id || callerAddress;
            scArgs = [new StellarSdk.Address(target).toScVal()];
            break;
          }

          case 'transfer': {
            if (!params.to) {
              return { success: false, error: "Parameter 'to' is required for transfer action." };
            }
            if (!params.amount) {
              return { success: false, error: "Parameter 'amount' is required for transfer action." };
            }
            const fromScVal = new StellarSdk.Address(callerAddress).toScVal();
            const toScVal = new StellarSdk.Address(params.to).toScVal();
            const amountScVal = StellarSdk.nativeToScVal(BigInt(params.amount), { type: 'i128' });
            scArgs = [fromScVal, toScVal, amountScVal];
            break;
          }

          case 'allowance': {
            const owner = params.id || callerAddress;
            if (!params.spender) {
              return { success: false, error: "Parameter 'spender' is required for allowance action." };
            }
            const ownerScVal = new StellarSdk.Address(owner).toScVal();
            const spenderScVal = new StellarSdk.Address(params.spender).toScVal();
            scArgs = [ownerScVal, spenderScVal];
            break;
          }

          case 'approve': {
            if (!params.spender) {
              return { success: false, error: "Parameter 'spender' is required for approve action." };
            }
            if (!params.amount) {
              return { success: false, error: "Parameter 'amount' is required for approve action." };
            }
            const fromScVal = new StellarSdk.Address(callerAddress).toScVal();
            const spenderScVal = new StellarSdk.Address(params.spender).toScVal();
            const amountScVal = StellarSdk.nativeToScVal(BigInt(params.amount), { type: 'i128' });
            const expLedger = params.expirationLedger ?? 3100000;
            const expScVal = StellarSdk.nativeToScVal(expLedger, { type: 'u32' });
            scArgs = [fromScVal, spenderScVal, amountScVal, expScVal];
            break;
          }

          default:
            return { success: false, error: `Unsupported SEP-0041 action: ${params.action}` };
        }

        const sourceAccount = await agent.getHorizonServer().loadAccount(callerAddress);
        const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: '100000',
          networkPassphrase: agent.getNetworkPassphrase()
        })
          .addOperation(contract.call(params.action, ...scArgs))
          .setTimeout(30)
          .build();

        const simulation = await agent.getRpcServer().simulateTransaction(tx);
        if (params.simulateOnly || StellarSdk.rpc.Api.isSimulationError(simulation)) {
          return {
            success: true,
            data: {
              action: params.action,
              contractId: params.contractId,
              simulation,
              simulated: true
            }
          };
        }

        const preparedTx = await agent.getRpcServer().prepareTransaction(tx);
        preparedTx.sign(agent.getKeypair());
        const sendResponse = await agent.getRpcServer().sendTransaction(preparedTx);

        return {
          success: true,
          data: {
            action: params.action,
            contractId: params.contractId,
            txHash: sendResponse.hash,
            status: sendResponse.status
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
