import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, createSep41TokenTool, createElizaPlugin } from '../dist/index.js';

describe('SEP-0041 Token Standard Tool Suite', () => {
  const testKeypair = StellarSdk.Keypair.random();
  const secret = testKeypair.secret();
  const kit = new SorobanAgentKit({ secretKey: secret });
  const sep41Tool = createSep41TokenTool(kit);

  test('should have proper tool definition and parameter schema', () => {
    assert.strictEqual(sep41Tool.name, 'soroban_sep41_token');
    assert.ok(sep41Tool.description.includes('SEP-0041'));
    assert.strictEqual(sep41Tool.parameters.type, 'object');
    assert.deepStrictEqual(sep41Tool.parameters.required, ['contractId', 'action']);
    assert.ok(sep41Tool.parameters.properties.action.enum.includes('balance'));
    assert.ok(sep41Tool.parameters.properties.action.enum.includes('transfer'));
    assert.ok(sep41Tool.parameters.properties.action.enum.includes('allowance'));
    assert.ok(sep41Tool.parameters.properties.action.enum.includes('approve'));
  });

  test('should validate missing required parameters on transfer action', async () => {
    const res = await sep41Tool.execute({
      contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      action: 'transfer'
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes("Parameter 'to' is required"));
  });

  test('should validate missing required parameters on allowance action', async () => {
    const res = await sep41Tool.execute({
      contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      action: 'allowance'
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes("Parameter 'spender' is required"));
  });

  test('should validate missing required parameters on approve action', async () => {
    const res = await sep41Tool.execute({
      contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      action: 'approve',
      spender: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI'
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes("Parameter 'amount' is required"));
  });

  test('should reject unsupported action with error', async () => {
    const res = await sep41Tool.execute({
      contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      action: 'invalid_action'
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('Unsupported SEP-0041 action'));
  });
});

describe('ElizaOS Plugin Adapter Suite', () => {
  const testKeypair = StellarSdk.Keypair.random();
  const secret = testKeypair.secret();
  const kit = new SorobanAgentKit({ secretKey: secret });
  const plugin = createElizaPlugin(kit);

  test('should instantiate valid ElizaOS plugin schema', () => {
    assert.strictEqual(plugin.name, 'stellar-agentkit');
    assert.ok(plugin.actions.length >= 2);
    const actionNames = plugin.actions.map(a => a.name);
    assert.ok(actionNames.includes('STELLAR_CHECK_BALANCE'));
    assert.ok(actionNames.includes('STELLAR_TRANSFER_TOKEN'));
  });

  test('should validate parameters for STELLAR_TRANSFER_TOKEN', async () => {
    const transferAction = plugin.actions.find(a => a.name === 'STELLAR_TRANSFER_TOKEN');
    assert.ok(transferAction);
    const invalid = await transferAction.validate({}, { content: {} });
    assert.strictEqual(invalid, false);

    const valid = await transferAction.validate({}, {
      content: { destination: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI', amount: '10' }
    });
    assert.strictEqual(valid, true);
  });
});
