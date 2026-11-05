#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, toOpenAITools } from '../dist/index.js';

const rl = readline.createInterface({ input, output });

async function main() {
  console.log('\n======================================================');
  console.log('🤖  Soroban AgentKit - Interactive Terminal CLI Demo  ');
  console.log('======================================================\n');

  let secretKey = process.env.STELLAR_SECRET_KEY;
  let network = process.env.STELLAR_NETWORK || 'testnet';

  if (!secretKey) {
    console.log('ℹ️  STELLAR_SECRET_KEY environment variable not detected.');
    const answer = await rl.question(
      'Enter your Stellar secret key (or press ENTER to generate a random Testnet keypair): '
    );

    if (answer.trim()) {
      secretKey = answer.trim();
    } else {
      const generated = StellarSdk.Keypair.random();
      secretKey = generated.secret();
      console.log('✨ Generated new random Testnet Keypair:');
      console.log(`   Public Key: ${generated.publicKey()}`);
      console.log(`   Secret Key: ${secretKey}\n`);
    }
  }

  let agent;
  try {
    agent = new SorobanAgentKit({
      secretKey,
      network: network === 'mainnet' ? 'mainnet' : network === 'standalone' ? 'standalone' : 'testnet'
    });
    console.log('✅ SorobanAgentKit successfully initialized!');
    console.log(`   Public Address : ${agent.getPublicKey()}`);
    console.log(`   Network        : ${agent.getNetwork()}`);
    console.log(`   Horizon URL    : ${agent.getHorizonUrl()}`);
    console.log(`   RPC URL        : ${agent.getRpcUrl()}\n`);
  } catch (err) {
    console.error('❌ Failed to initialize SorobanAgentKit:', err.message);
    rl.close();
    process.exit(1);
  }

  let running = true;
  while (running) {
    console.log('------------------------------------------------------');
    console.log('Select an action:');
    console.log('  1. Check account balances');
    console.log('  2. Transfer native XLM');
    console.log('  3. Simulate Soroban contract call');
    console.log('  4. List registered AgentKit tools');
    console.log('  5. Inspect OpenAI function calling schema');
    console.log('  6. Exit');
    console.log('------------------------------------------------------');

    const choice = await rl.question('Enter choice [1-6]: ');

    switch (choice.trim()) {
      case '1': {
        const targetAddress = await rl.question(
          `Enter Stellar address to query (press ENTER for agent address ${agent.getPublicKey()}): `
        );
        const queryAddr = targetAddress.trim() || agent.getPublicKey();
        try {
          console.log(`\n⏳ Fetching balances for ${queryAddr}...`);
          const balances = await agent.getBalances(queryAddr);
          console.log('📊 Account Balances:');
          balances.forEach((b) => {
            console.log(`   - ${b.asset}: ${b.balance}${b.limit ? ` (Limit: ${b.limit})` : ''}`);
          });
        } catch (err) {
          console.error(`❌ Error fetching balance: ${err.message}`);
          if (err.message.includes('404')) {
            console.log('💡 Tip: On testnet, unfunded accounts return 404 until funded via friendbot.');
          }
        }
        console.log();
        break;
      }

      case '2': {
        const destination = await rl.question('Enter recipient Stellar public address: ');
        if (!destination.trim()) {
          console.log('⚠️ Destination address cannot be empty.\n');
          break;
        }

        const amount = await rl.question('Enter amount of XLM to transfer: ');
        if (!amount.trim() || isNaN(Number(amount))) {
          console.log('⚠️ Valid numeric amount is required.\n');
          break;
        }

        try {
          console.log(`\n⏳ Sending ${amount} XLM to ${destination.trim()}...`);
          const txResult = await agent.transferToken({
            destination: destination.trim(),
            amount: amount.trim(),
            assetCode: 'XLM'
          });
          console.log('✅ Transfer transaction submitted successfully:');
          console.log(`   Tx Hash : ${txResult.hash}`);
          console.log(`   Ledger  : ${txResult.ledger}`);
        } catch (err) {
          console.error(`❌ Transfer failed: ${err.message}`);
        }
        console.log();
        break;
      }

      case '3': {
        const contractId = await rl.question('Enter Soroban Contract ID (C...): ');
        if (!contractId.trim()) {
          console.log('⚠️ Contract ID is required.\n');
          break;
        }

        const method = await rl.question('Enter contract function / method name: ');
        if (!method.trim()) {
          console.log('⚠️ Method name is required.\n');
          break;
        }

        try {
          console.log(`\n⏳ Simulating invocation of ${method.trim()} on ${contractId.trim()}...`);
          const simResult = await agent.simulateContractCall({
            contractId: contractId.trim(),
            method: method.trim(),
            args: []
          });
          console.log('📋 Simulation Result:');
          console.log(JSON.stringify(simResult, null, 2));
        } catch (err) {
          console.error(`❌ Contract simulation failed: ${err.message}`);
        }
        console.log();
        break;
      }

      case '4': {
        console.log('\n🛠️  Registered Agent Tools:');
        const tools = agent.getTools();
        tools.forEach((t, i) => {
          console.log(`   ${i + 1}. [${t.name}]`);
          console.log(`      ${t.description}`);
          console.log(`      Parameters: ${JSON.stringify(t.parameters)}`);
        });
        console.log();
        break;
      }

      case '5': {
        console.log('\n📋 OpenAI Function Calling Schema:');
        const tools = agent.getTools();
        const schemas = toOpenAITools(tools);
        console.log(JSON.stringify(schemas, null, 2));
        console.log();
        break;
      }

      case '6':
      case 'q':
      case 'exit': {
        console.log('👋 Exiting Soroban AgentKit CLI demo. Happy building!');
        running = false;
        break;
      }

      default: {
        console.log('⚠️ Invalid option. Please select 1 through 6.\n');
        break;
      }
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
