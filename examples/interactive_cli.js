#!/usr/bin/env node
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit } from '../dist/index.js';

const rl = readline.createInterface({ input, output });

async function main() {
  console.log('====================================================');
  console.log('🤖 SorobanAgentKit Interactive Terminal CLI Demo');
  console.log('====================================================\n');

  let secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    const answer = await rl.question('Enter Stellar Secret Key (press Enter to generate testnet keypair): ');
    if (answer.trim()) {
      secretKey = answer.trim();
    } else {
      const generated = StellarSdk.Keypair.random();
      secretKey = generated.secret();
      console.log(`ℹ️ Generated ephemeral Testnet Keypair:`);
      console.log(`   Public Key: ${generated.publicKey()}`);
      console.log(`   Secret Key: ${secretKey}\n`);
    }
  }

  let agent;
  try {
    agent = new SorobanAgentKit({
      secretKey,
      network: 'testnet'
    });
    console.log(`✅ Agent initialized on Testnet! Public Key: ${agent.getPublicKey()}\n`);
  } catch (err) {
    console.error(`❌ Initialization failed: ${err.message}`);
    rl.close();
    process.exit(1);
  }

  while (true) {
    console.log('----------------------------------------------------');
    console.log('Select an Action:');
    console.log('1. Check Account Balances');
    console.log('2. Send XLM / Token Payment');
    console.log('3. Query SEP-0041 Token Balance / Allowance');
    console.log('4. Simulate Smart Contract Call');
    console.log('5. List Available Agent Tools');
    console.log('0. Exit');
    console.log('----------------------------------------------------');

    const choice = await rl.question('Enter option (0-5): ');

    try {
      if (choice.trim() === '0') {
        console.log('👋 Goodbye!');
        break;
      } else if (choice.trim() === '1') {
        const addr = await rl.question(`Enter Stellar address (press Enter for agent address): `);
        const target = addr.trim() || agent.getPublicKey();
        console.log(`⏳ Fetching balances for ${target}...`);
        try {
          const balances = await agent.getBalances(target);
          console.log('\n📊 Account Balances:');
          balances.forEach(b => console.log(`   - ${b.balance} ${b.asset}`));
        } catch (e) {
          console.log(`⚠️ Account may not exist or is unfunded on Testnet: ${e.message}`);
        }
      } else if (choice.trim() === '2') {
        const dest = await rl.question('Enter recipient public key (G...): ');
        const amt = await rl.question('Enter XLM amount to send: ');
        if (!dest.trim() || !amt.trim()) {
          console.log('⚠️ Destination and amount cannot be empty.');
          continue;
        }
        console.log(`⏳ Submitting transaction of ${amt} XLM to ${dest}...`);
        try {
          const res = await agent.transferPayment({ destination: dest.trim(), amount: amt.trim() });
          console.log(`✅ Payment submitted! Transaction Hash: ${res.hash || res.id}`);
        } catch (e) {
          console.log(`❌ Payment failed: ${e.message}`);
        }
      } else if (choice.trim() === '3') {
        const contractId = await rl.question('Enter SEP-0041 Contract ID (C...): ');
        const accountId = await rl.question('Enter Account Address (press Enter for agent address): ');
        const targetId = accountId.trim() || agent.getPublicKey();
        console.log(`⏳ Querying SEP-0041 balance for ${targetId}...`);
        const tools = agent.getTools();
        const sep41Tool = tools.find(t => t.name === 'soroban_sep41_token');
        const res = await sep41Tool.execute({
          contractId: contractId.trim(),
          action: 'balance',
          id: targetId
        });
        console.log('Result:', JSON.stringify(res, null, 2));
      } else if (choice.trim() === '4') {
        const contractId = await rl.question('Enter Contract ID (C...): ');
        const method = await rl.question('Enter Method Name: ');
        console.log(`⏳ Simulating invocation of ${method} on ${contractId}...`);
        const res = await agent.invokeContract({
          contractId: contractId.trim(),
          method: method.trim(),
          args: [],
          simulateOnly: true
        });
        console.log('Simulation Result:', JSON.stringify(res, null, 2));
      } else if (choice.trim() === '5') {
        console.log('\n🛠️ Active Agent Tools:');
        agent.getTools().forEach((t, i) => {
          console.log(`   ${i + 1}. [${t.name}] - ${t.description}`);
        });
      } else {
        console.log('⚠️ Invalid option. Please select 0 to 5.');
      }
    } catch (err) {
      console.error(`❌ Unexpected error: ${err.message}`);
    }
    console.log();
  }

  rl.close();
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
