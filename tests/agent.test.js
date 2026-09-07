import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, toOpenAITools, toLangChainTools } from '../dist/index.js';

describe('SorobanAgentKit Test Suite', () => {
  const testKeypair = StellarSdk.Keypair.random();
  const secret = testKeypair.secret();
  const pubKey = testKeypair.publicKey();

  test('should throw error if secretKey is not provided', () => {
    assert.throws(() => {
      new SorobanAgentKit({});
    }, /Secret key is required/);
  });

  test('should initialize successfully with default testnet settings', () => {
    const kit = new SorobanAgentKit({ secretKey: secret });
    assert.strictEqual(kit.getNetwork(), 'testnet');
    assert.strictEqual(kit.getPublicKey(), pubKey);
    assert.ok(kit.getRpcUrl().includes('testnet'));
  });

  test('should initialize with mainnet settings when specified', () => {
    const kit = new SorobanAgentKit({ secretKey: secret, network: 'mainnet' });
    assert.strictEqual(kit.getNetwork(), 'mainnet');
    assert.ok(kit.getRpcUrl().includes('mainnet'));
  });

  test('should return standard agent tools list', () => {
    const kit = new SorobanAgentKit({ secretKey: secret });
    const tools = kit.getTools();
    assert.strictEqual(tools.length, 4);

    const names = tools.map(t => t.name);
    assert.ok(names.includes('stellar_get_balance'));
    assert.ok(names.includes('stellar_transfer_token'));
    assert.ok(names.includes('stellar_get_account_info'));
    assert.ok(names.includes('soroban_call_contract'));
  });

  test('should convert tools to OpenAI function calling format', () => {
    const kit = new SorobanAgentKit({ secretKey: secret });
    const tools = kit.getTools();
    const openaiTools = toOpenAITools(tools);

    assert.strictEqual(openaiTools.length, 4);
    assert.strictEqual(openaiTools[0].type, 'function');
    assert.ok(openaiTools[0].function.name);
    assert.ok(openaiTools[0].function.description);
    assert.ok(openaiTools[0].function.parameters);
  });

  test('should convert tools to LangChain structured format', () => {
    const kit = new SorobanAgentKit({ secretKey: secret });
    const tools = kit.getTools();
    const lcTools = toLangChainTools(tools);

    assert.strictEqual(lcTools.length, 4);
    assert.ok(typeof lcTools[0].func === 'function');
    assert.ok(lcTools[0].name);
  });
});
