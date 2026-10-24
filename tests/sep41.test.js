import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, createSep41TokenTool } from '../dist/index.js';

describe('SEP-0041 Token Standard Tool Tests', () => {
  const testKeypair = StellarSdk.Keypair.random();
  const secret = testKeypair.secret();
  const kit = new SorobanAgentKit({ secretKey: secret });
  const sep41Tool = createSep41TokenTool(kit);

  test('should have proper tool definition and metadata', () => {
    assert.strictEqual(sep41Tool.name, 'soroban_sep41_token');
    assert.ok(sep41Tool.description.includes('SEP-0041'));
    assert.strictEqual(sep41Tool.parameters.type, 'object');
    assert.deepStrictEqual(sep41Tool.parameters.required, ['contractId', 'action']);
    assert.ok(sep41Tool.parameters.properties.contractId);
    assert.ok(sep41Tool.parameters.properties.action);
  });

  test('should be included in SorobanAgentKit.getTools()', () => {
    const tools = kit.getTools();
    const found = tools.find(t => t.name === 'soroban_sep41_token');
    assert.ok(found, 'soroban_sep41_token should be in getTools() list');
  });

  test('should reject execution when contractId is missing', async () => {
    const result = await sep41Tool.execute({
      action: 'balance'
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('contractId is required'));
  });

  test('should reject unsupported actions', async () => {
    const result = await sep41Tool.execute({
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      action: 'invalid_action'
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Unsupported SEP-0041 action'));
  });

  test('should validate required parameters for transfer', async () => {
    const result = await sep41Tool.execute({
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      action: 'transfer'
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Recipient "to" address is required'));
  });

  test('should validate required parameters for allowance and approve', async () => {
    const allowanceResult = await sep41Tool.execute({
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      action: 'allowance'
    });
    assert.strictEqual(allowanceResult.success, false);
    assert.ok(allowanceResult.error.includes('Spender address is required'));

    const approveResult = await sep41Tool.execute({
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      action: 'approve'
    });
    assert.strictEqual(approveResult.success, false);
    assert.ok(approveResult.error.includes('Spender address is required'));
  });
});
