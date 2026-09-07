import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanAgentKit, toOpenAITools } from '../dist/index.js';

// Generate a random test account
const keypair = StellarSdk.Keypair.random();

console.log('🤖 Initializing SorobanAgentKit...');
const agent = new SorobanAgentKit({
  secretKey: keypair.secret(),
  network: 'testnet'
});

console.log('✅ Agent initialized:');
console.log('  Public Key:', agent.getPublicKey());
console.log('  Network:', agent.getNetwork());
console.log('  RPC URL:', agent.getRpcUrl());

console.log('\n🛠️ Available Agent Tools:');
const tools = agent.getTools();
tools.forEach((tool, idx) => {
  console.log(`  ${idx + 1}. ${tool.name}: ${tool.description}`);
});

console.log('\n📋 OpenAI Function Calling Schema:');
const openAITools = toOpenAITools(tools);
console.log(JSON.stringify(openAITools[0], null, 2));
