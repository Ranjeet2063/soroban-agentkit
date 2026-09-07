import { AgentTool } from '../types.js';

export interface LangChainToolLike {
  name: string;
  description: string;
  func: (input: any) => Promise<any>;
}

/**
 * Adapts SorobanAgentKit tools for LangChain agents and tool executors.
 */
export function toLangChainTools(tools: AgentTool[]): LangChainToolLike[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    func: async (input: any) => {
      const args = typeof input === 'string' ? JSON.parse(input) : input;
      const res = await tool.execute(args);
      return JSON.stringify(res);
    }
  }));
}
