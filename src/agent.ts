import * as StellarSdk from '@stellar/stellar-sdk';
import { AgentKitConfig, AgentTool } from './types.js';
import { createGetBalanceTool } from './tools/get_balance.js';
import { createTransferTokenTool } from './tools/transfer_token.js';
import { createGetAccountInfoTool } from './tools/get_account_info.js';
import { createCallContractTool } from './tools/call_contract.js';

export interface AccountBalanceInfo {
  asset: string;
  balance: string;
  limit?: string;
}

export interface AccountMetadataInfo {
  id: string;
  sequence: string;
  subentryCount: number;
  thresholds: any;
  signers: any[];
}

export class SorobanAgentKit {
  private keypair: StellarSdk.Keypair;
  private network: 'testnet' | 'mainnet' | 'standalone';
  private rpcUrl: string;
  private horizonUrl: string;
  private networkPassphrase: string;
  private server: StellarSdk.Horizon.Server;
  private rpcServer: StellarSdk.rpc.Server;

  constructor(config: AgentKitConfig) {
    if (!config.secretKey) {
      throw new Error('Secret key is required to initialize SorobanAgentKit.');
    }

    this.keypair = StellarSdk.Keypair.fromSecret(config.secretKey);
    this.network = config.network || 'testnet';

    if (this.network === 'mainnet') {
      this.networkPassphrase = StellarSdk.Networks.PUBLIC;
      this.rpcUrl = config.rpcUrl || 'https://mainnet.sorobanrpc.com';
      this.horizonUrl = config.horizonUrl || 'https://horizon.stellar.org';
    } else if (this.network === 'standalone') {
      this.networkPassphrase = StellarSdk.Networks.STANDALONE;
      this.rpcUrl = config.rpcUrl || 'http://localhost:8000/soroban/rpc';
      this.horizonUrl = config.horizonUrl || 'http://localhost:8000';
    } else {
      this.networkPassphrase = StellarSdk.Networks.TESTNET;
      this.rpcUrl = config.rpcUrl || 'https://soroban-testnet.stellar.org';
      this.horizonUrl = config.horizonUrl || 'https://horizon-testnet.stellar.org';
    }

    this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
    this.rpcServer = new StellarSdk.rpc.Server(this.rpcUrl, {
      allowHttp: this.network === 'standalone'
    });
  }

  public getKeypair(): StellarSdk.Keypair {
    return this.keypair;
  }

  public getPublicKey(): string {
    return this.keypair.publicKey();
  }

  public getNetwork(): string {
    return this.network;
  }

  public getRpcUrl(): string {
    return this.rpcUrl;
  }

  public getHorizonUrl(): string {
    return this.horizonUrl;
  }

  public getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  public getHorizonServer(): StellarSdk.Horizon.Server {
    return this.server;
  }

  public getRpcServer(): StellarSdk.rpc.Server {
    return this.rpcServer;
  }

  /**
   * Fetch balances for a target public key address.
   */
  public async getBalances(address: string): Promise<AccountBalanceInfo[]> {
    const account = await this.server.loadAccount(address);
    return account.balances.map((b: any) => ({
      asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
      balance: b.balance,
      limit: b.limit
    }));
  }

  /**
   * Fetch account sequence and metadata.
   */
  public async getAccountInfo(address: string): Promise<AccountMetadataInfo> {
    const account = await this.server.loadAccount(address);
    return {
      id: account.id,
      sequence: account.sequence,
      subentryCount: account.subentry_count,
      thresholds: account.thresholds,
      signers: account.signers
    };
  }

  /**
   * Send a payment to a destination address.
   */
  public async transferPayment(params: {
    destination: string;
    amount: string;
    assetCode?: string;
    memo?: string;
  }): Promise<any> {
    const sourceAccount = await this.server.loadAccount(this.getPublicKey());
    const asset = params.assetCode && params.assetCode !== 'XLM'
      ? new StellarSdk.Asset(params.assetCode, this.getPublicKey())
      : StellarSdk.Asset.native();

    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase
    }).addOperation(
      StellarSdk.Operation.payment({
        destination: params.destination,
        asset,
        amount: params.amount
      })
    ).setTimeout(30);

    if (params.memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(params.memo));
    }

    const tx = txBuilder.build();
    tx.sign(this.keypair);

    return await this.server.submitTransaction(tx);
  }

  /**
   * Invoke a Soroban smart contract method.
   */
  public async invokeContract(params: {
    contractId: string;
    method: string;
    args: any[];
    simulateOnly?: boolean;
  }): Promise<any> {
    const contract = new StellarSdk.Contract(params.contractId);
    const sourceAccount = await this.server.loadAccount(this.getPublicKey());

    const scArgs = params.args.map((arg) => {
      if (typeof arg === 'string') return StellarSdk.xdr.ScVal.scvString(arg);
      if (typeof arg === 'number') return StellarSdk.xdr.ScVal.scvI32(arg);
      if (typeof arg === 'boolean') return StellarSdk.xdr.ScVal.scvBool(arg);
      return StellarSdk.xdr.ScVal.scvVoid();
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase
    })
      .addOperation(contract.call(params.method, ...scArgs))
      .setTimeout(30)
      .build();

    const simulation = await this.rpcServer.simulateTransaction(tx);
    if (params.simulateOnly || StellarSdk.rpc.Api.isSimulationError(simulation)) {
      return {
        simulation,
        simulated: true
      };
    }

    const preparedTx = await this.rpcServer.prepareTransaction(tx);
    preparedTx.sign(this.keypair);

    const sendResponse = await this.rpcServer.sendTransaction(preparedTx);
    return {
      txHash: sendResponse.hash,
      status: sendResponse.status
    };
  }

  /**
   * Returns all available tools for agent executors.
   */
  public getTools(): AgentTool[] {
    return [
      createGetBalanceTool(this),
      createTransferTokenTool(this),
      createGetAccountInfoTool(this),
      createCallContractTool(this)
    ];
  }
}
