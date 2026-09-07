# 🦀 Soroban AgentKit

[![CI](https://github.com/Ranjeet2063/soroban-agentkit/actions/workflows/ci.yml/badge.svg)](https://github.com/Ranjeet2063/soroban-agentkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v22%2B-brightgreen)](https://nodejs.org)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue)](https://stellar.org)

**Soroban AgentKit** is a production-grade, modular TypeScript toolkit and SDK that connects autonomous AI agents (ElizaOS, LangChain, CrewAI, AutoGen, and OpenAI function calling) directly to the **Stellar blockchain** and **Soroban smart contracts**.

Empower your LLMs to query balances, transfer native XLM or SAC tokens, simulate and invoke Soroban contracts, and interact with the decentralized financial ecosystem in natural language.

---

## 🌟 Key Features

- ⚡ **Lightweight & Modular**: Zero unnecessary bloat. Pure TypeScript with first-class `@stellar/stellar-sdk` support.
- 🤖 **Universal Framework Adapters**: Out-of-the-box adapters for **OpenAI / Anthropic Function Calling**, **LangChain Structured Tools**, and **ElizaOS Actions**.
- 🔐 **Secure Key Management**: Client-side transaction signing with Stellar Keypairs. Private keys never leave your runtime environment.
- 📦 **Smart Contract Support**: Seamlessly simulate and execute invocations on any deployed Soroban smart contract with automatic type serializations.
- 🌐 **Multi-Network Ready**: First-class support for `testnet`, `mainnet`, and local `standalone` networks.

---

## 📦 Installation

```bash
npm install soroban-agentkit
```

---

## 🚀 Quickstart

### 1. Initialize the Agent Kit

```typescript
import { SorobanAgentKit, toOpenAITools } from 'soroban-agentkit';

// Initialize with your Stellar secret key
const agent = new SorobanAgentKit({
  secretKey: process.env.STELLAR_SECRET_KEY!,
  network: 'testnet' // 'testnet' | 'mainnet' | 'standalone'
});

console.log('Agent Public Key:', agent.getPublicKey());
console.log('Network:', agent.getNetwork());
```

### 2. Use with OpenAI Function Calling

```typescript
import OpenAI from 'openai';
import { SorobanAgentKit, toOpenAITools } from 'soroban-agentkit';

const agent = new SorobanAgentKit({ secretKey: process.env.STELLAR_SECRET_KEY! });
const tools = agent.getTools();
const openaiTools = toOpenAITools(tools);

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'What is my current XLM balance?' }],
  tools: openaiTools
});
```

### 3. Use with LangChain

```typescript
import { SorobanAgentKit, toLangChainTools } from 'soroban-agentkit';

const agent = new SorobanAgentKit({ secretKey: process.env.STELLAR_SECRET_KEY! });
const langchainTools = toLangChainTools(agent.getTools());
```

---

## 🛠️ Built-in Agent Tools

| Tool Name | Description |
| :--- | :--- |
| `stellar_get_balance` | Queries native XLM and issued asset balances for any Stellar address. |
| `stellar_transfer_token` | Sends native XLM or assets to a recipient with an optional memo. |
| `stellar_get_account_info` | Retrieves account sequence, thresholds, subentry count, and active signers. |
| `soroban_call_contract` | Simulates and executes smart contract function calls with arguments. |

---

## 🧪 Development & Testing

```bash
# Clone the repository
git clone https://github.com/Ranjeet2063/soroban-agentkit.git
cd soroban-agentkit

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run type checks
npm run typecheck

# Run unit tests
npm test
```

### Interactive CLI

Soroban AgentKit includes an interactive terminal example for testing common agent actions on Stellar Testnet.

The CLI supports:

- Checking the account's XLM and asset balances
- Transferring XLM to another Stellar address
- Simulating a Soroban smart contract call
- Graceful handling of missing credentials and failed operations

#### Setup

Create and fund a Stellar Testnet account, then set its secret key as the `STELLAR_SECRET_KEY` environment variable.

**PowerShell:**

```powershell
$env:STELLAR_SECRET_KEY = "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Linux/macOS:**

```bash
export STELLAR_SECRET_KEY="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> **Security:** Never commit your secret key to the repository or share it publicly.

Build the project before running the CLI:

```bash
npm run build
```

Start the interactive CLI:

```bash
node examples/interactive_cli.js
```

The CLI provides four options:

```text
1. Check balance
2. Transfer XLM
3. Simulate contract call
4. Exit
```

#### Check Balance

Select `1` to retrieve the current balances of the configured Testnet account.

#### Transfer XLM

Select `2` and provide the recipient Stellar address and amount. The CLI asks for confirmation before submitting the transaction.

Example:

```text
Select an option: 2

Recipient Stellar address: G...
Amount of XLM: 1

Send 1 XLM to G...? (y/N): y

Submitting XLM transfer...

Transfer successful!
Transaction hash: ...
```

#### Simulate a Soroban Contract Call

Select `3` and provide:

1. The deployed Soroban contract ID
2. The contract method
3. Arguments as a JSON array

For example:

```text
Select an option: 3

Contract ID: C...
Contract method: hello
Arguments as JSON array (press Enter for none): ["OpenSource"]

Simulating contract call...

Simulation completed.
```

The contract must be deployed on the configured Stellar Testnet, and the supplied method and arguments must match the contract interface.

The CLI uses simulation mode for this option, so it does not submit a signed transaction.

#### Error Handling

If `STELLAR_SECRET_KEY` is missing, the CLI exits with a clear error message:

```text
Missing STELLAR_SECRET_KEY environment variable.
Set your Stellar testnet secret key before running this example.
```

Transaction and contract errors are also caught and displayed without exposing the configured secret key.

---

## 🤝 Contributing

Contributions are warmly welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on submitting pull requests and reporting issues.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
