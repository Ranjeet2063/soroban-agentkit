import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, toElizaActions, toElizaPlugin } from '../dist/index.js';

describe('ElizaOS Adapter Tests', () => {
  const testKeypair = StellarSdk.Keypair.random();
  const secret = testKeypair.secret();
  const kit = new SorobanAgentKit({ secretKey: secret });

  test('should generate standard ElizaOS actions list', () => {
    const actions = toElizaActions(kit);
    assert.strictEqual(actions.length, 2);

    const names = actions.map(a => a.name);
    assert.ok(names.includes('STELLAR_CHECK_BALANCE'));
    assert.ok(names.includes('STELLAR_TRANSFER_TOKEN'));
  });

  test('each action should implement required ElizaOS schema properties', () => {
    const actions = toElizaActions(kit);
    for (const action of actions) {
      assert.ok(typeof action.name === 'string');
      assert.ok(Array.isArray(action.similes) && action.similes.length > 0);
      assert.ok(typeof action.description === 'string');
      assert.ok(typeof action.validate === 'function');
      assert.ok(typeof action.handler === 'function');
      assert.ok(Array.isArray(action.examples) && action.examples.length > 0);
    }
  });

  test('should validate agent readiness successfully', async () => {
    const actions = toElizaActions(kit);
    const balanceAction = actions.find(a => a.name === 'STELLAR_CHECK_BALANCE');
    const transferAction = actions.find(a => a.name === 'STELLAR_TRANSFER_TOKEN');

    const isValidBalance = await balanceAction.validate({}, {});
    assert.strictEqual(isValidBalance, true);

    const isValidTransfer = await transferAction.validate({}, {});
    assert.strictEqual(isValidTransfer, true);
  });

  test('should wrap actions in ElizaOS plugin format', () => {
    const plugin = toElizaPlugin(kit);
    assert.strictEqual(plugin.name, 'soroban-agentkit-plugin');
    assert.ok(plugin.description.includes('ElizaOS plugin'));
    assert.strictEqual(plugin.actions.length, 2);
  });

  test('transfer handler should fail gracefully if amount or destination is missing', async () => {
    const actions = toElizaActions(kit);
    const transferAction = actions.find(a => a.name === 'STELLAR_TRANSFER_TOKEN');

    let callbackCalled = false;
    let callbackError = false;
    const result = await transferAction.handler(
      {},
      { content: { text: 'Hello, please send some money' } },
      {},
      {},
      (msg) => {
        callbackCalled = true;
        callbackError = msg.error;
      }
    );

    assert.strictEqual(result, false);
    assert.strictEqual(callbackCalled, true);
    assert.strictEqual(callbackError, true);
  });
});
