/**
 * Configuration options for initializing SorobanAgentKit.
 */
export interface AgentKitConfig {
  /**
   * Stellar secret key starting with 'S' (or private key hex).
   */
  secretKey: string;

  /**
   * Target Stellar network environment.
   * Defaults to 'testnet'.
   */
  network?: 'testnet' | 'mainnet' | 'standalone';

  /**
   * Custom Soroban RPC endpoint URL.
   * If omitted, defaults to official public RPC endpoints.
   */
  rpcUrl?: string;

  /**
   * Custom Horizon API endpoint URL.
   * If omitted, defaults to official public Horizon endpoints.
   */
  horizonUrl?: string;
}

/**
 * Standard tool definition accepted by Agent frameworks.
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (params: any) => Promise<any>;
}

/**
 * Execution result format.
 */
export interface ToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}
