import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SorobanAgentKit } from '../dist/index.js';

const rl = createInterface({ input, output });

function printError(error) {
  console.error(`\nError: ${error?.message || String(error)}\n`);
}

async function askRequired(question) {
  const answer = (await rl.question(question)).trim();

  if (!answer) {
    throw new Error('This value is required.');
  }

  return answer;
}

async function checkBalance(agent) {
  try {
    const balances = await agent.getBalances(agent.getPublicKey());

    console.log('\n<--Account Balance-->');
    console.log('------------------------');

    if (balances.length === 0) {
      console.log('No balances found.');
      return;
    }

    for (const balance of balances) {
      console.log(`${balance.asset}: ${balance.balance}`);
    }

    console.log();
  } catch (error) {
    printError(error);
  }
}

async function transferXlm(agent) {
  try {
    const destination = await askRequired(
      '\nRecipient Stellar address: '
    );

    const amount = await askRequired(
      'Amount of XLM: '
    );

    const confirmation = await rl.question(
      `\nSend ${amount} XLM to ${destination}? (y/N): `
    );

    if (confirmation.trim().toLowerCase() !== 'y') {
      console.log('\nTransfer cancelled.\n');
      return;
    }

    console.log('\nSubmitting XLM transfer...');

    const result = await agent.transferPayment({
      destination,
      amount,
      assetCode: 'XLM'
    });

    console.log('\nTransfer successful!');
    console.log(`Transaction hash: ${result.hash}\n`);
  } catch (error) {
    printError(error);
  }
}

function parseContractArgs(value) {
  if (!value.trim()) {
    return [];
  }

  let parsed;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      'Contract arguments must be valid JSON, for example: ["hello", 1, true]'
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Contract arguments must be a JSON array.');
  }

  return parsed;
}

async function simulateContractCall(agent) {
  try {
    const contractId = await askRequired(
      '\nContract ID: '
    );

    const method = await askRequired(
      'Contract method: '
    );

    const argsInput = await rl.question(
      'Arguments as JSON array (press Enter for none): '
    );

    const args = parseContractArgs(argsInput);

    console.log('\nSimulating contract call...');

    const result = await agent.invokeContract({
      contractId,
      method,
      args,
      simulateOnly: true
    });

    console.log('\nSimulation completed.');
    console.log(JSON.stringify(result, null, 2));
    console.log();
  } catch (error) {
    printError(error);
  }
}

async function main() {
  const secretKey = process.env.STELLAR_SECRET_KEY;

  if (!secretKey) {
    console.error(
      '\nMissing STELLAR_SECRET_KEY environment variable.'
    );
    console.error(
      'Set your Stellar testnet secret key before running this example.\n'
    );

    rl.close();
    process.exitCode = 1;
    return;
  }

  let agent;

  try {
    agent = new SorobanAgentKit({
      secretKey,
      network: 'testnet'
    });
  } catch (error) {
    printError(error);
    rl.close();
    process.exitCode = 1;
    return;
  }

  console.log('\nSoroban AgentKit Interactive CLI');
  console.log('================================');
  console.log(`Network: ${agent.getNetwork()}`);
  console.log(`Account: ${agent.getPublicKey()}`);
  console.log(`RPC URL: ${agent.getRpcUrl()}`);

  let running = true;

  while (running) {
    console.log(`
What would you like to do?

1. Check balance
2. Transfer XLM
3. Simulate contract call
4. Exit
`);

    const choice = (await rl.question('Select an option: ')).trim();

    switch (choice) {
      case '1':
        await checkBalance(agent);
        break;

      case '2':
        await transferXlm(agent);
        break;

      case '3':
        await simulateContractCall(agent);
        break;

      case '4':
        running = false;
        console.log('\nGoodbye!!!\n');
        break;

      default:
        console.log('\nInvalid option. Please choose 1-4.\n');
    }
  }

  rl.close();
}

main().catch((error) => {
  printError(error);
  rl.close();
  process.exitCode = 1;
});