import { AgentTool } from '../types.js';

/**
 * Formats SorobanAgentKit tools into OpenAI / Anthropic function calling definitions.
 */
export function toOpenAITools(tools: AgentTool[]) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}
