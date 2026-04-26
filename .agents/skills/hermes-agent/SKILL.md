---
name: hermes-agent
description: "Build AI chat agents using Hermes LLM with TypeScript/JavaScript. Includes conversation management, tool integration, and multi-turn dialogue patterns."
category: ai-agents
risk: safe
source: community
date_added: "2026-04-26"
author: community
tags: [ai, agent, hermes, llm, chat, typescript, javascript]
tools: [claude, cursor, gemini]
---

# Hermes AI Chat Agent

## Overview

This skill provides comprehensive guidance for building AI chat agents powered by the Hermes LLM model family using TypeScript/JavaScript. It covers agent architecture, conversation state management, tool/function calling, and production-ready deployment patterns.

Hermes models (by Nous Research) are open-source instruction-tuned LLMs optimized for chat, reasoning, and tool use. This skill helps you integrate them into robust, scalable agent systems.

## When to Use This Skill

- Use when building conversational AI agents with Hermes LLM models
- Use when implementing chat interfaces with persistent conversation state
- Use when adding tool/function calling capabilities to your AI agent
- Use when optimizing agent performance, latency, or cost efficiency
- Use when migrating from proprietary LLM APIs to open-source Hermes models

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
2. Access to a Hermes model endpoint (local via Ollama/vLLM, or cloud provider)
3. Basic understanding of async/await patterns in JavaScript/TypeScript

## How It Works

### Step 1: Set Up Project Structure

Create a clean project structure for your Hermes agent:

```bash
mkdir hermes-agent && cd hermes-agent
npm init -y
npm install axios dotenv uuid
npm install --save-dev typescript @types/node ts-node
```

Initialize TypeScript configuration:

```bash
npx tsc --init
```

### Step 2: Configure Hermes Model Connection

Set up environment variables for your Hermes endpoint:

```env
# .env
HERMES_API_URL=http://localhost:11434/api/generate  # For Ollama
HERMES_MODEL_NAME=hermes3:latest
HERMES_TEMPERATURE=0.7
HERMES_MAX_TOKENS=2048
```

Create a connection module:

```typescript
// src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const hermesConfig = {
  apiUrl: process.env.HERMES_API_URL || 'http://localhost:11434/api/generate',
  modelName: process.env.HERMES_MODEL_NAME || 'hermes3:latest',
  temperature: parseFloat(process.env.HERMES_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.HERMES_MAX_TOKENS || '2048'),
};
```

### Step 3: Implement Conversation Manager

Build a conversation state manager that maintains context across turns:

```typescript
// src/conversation-manager.ts
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export class ConversationManager {
  private messages: Message[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory: number = 20) {
    this.maxHistory = maxHistory;
  }

  addMessage(role: Message['role'], content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Trim history if exceeds max
    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory);
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [];
  }

  formatForPrompt(): string {
    return this.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
  }
}
```

### Step 4: Build Hermes Client

Implement the API client for communicating with Hermes:

```typescript
// src/hermes-client.ts
import axios from 'axios';
import { hermesConfig } from './config';
import { ConversationManager } from './conversation-manager';

interface HermesResponse {
  response: string;
  done: boolean;
}

export class HermesClient {
  private conversationManager: ConversationManager;

  constructor() {
    this.conversationManager = new ConversationManager();
  }

  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationManager.addMessage('user', userMessage);

    try {
      const response = await axios.post<HermesResponse>(
        hermesConfig.apiUrl,
        {
          model: hermesConfig.modelName,
          prompt: this.buildPrompt(userMessage),
          temperature: hermesConfig.temperature,
          max_tokens: hermesConfig.maxTokens,
          stream: false,
        },
        {
          timeout: 30000,
        }
      );

      const assistantResponse = response.data.response;

      // Add assistant response to history
      this.conversationManager.addMessage('assistant', assistantResponse);

      return assistantResponse;
    } catch (error) {
      console.error('Error calling Hermes API:', error);
      throw new Error('Failed to get response from Hermes model');
    }
  }

  private buildPrompt(currentMessage: string): string {
    const systemPrompt = `You are a helpful AI assistant powered by Hermes. Be concise, accurate, and helpful.`;

    const history = this.conversationManager.formatForPrompt();

    return `${systemPrompt}\n\n${history}\n\nUSER: ${currentMessage}\nASSISTANT:`;
  }

  clearConversation(): void {
    this.conversationManager.clearHistory();
  }
}
```

### Step 5: Add Tool/Function Calling (Optional)

Enable your agent to call external functions:

```typescript
// src/tool-caller.ts
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

export class ToolCaller {
  private tools: Map<string, Tool> = new Map();

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    return await tool.execute(args);
  }

  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

// Example: Weather tool
const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    location: { type: 'string', required: true },
  },
  execute: async ({ location }) => {
    // Simulate weather API call
    return { location, temperature: 22, condition: 'sunny' };
  },
};
```

### Step 6: Create Main Agent Class

Combine all components into a unified agent:

```typescript
// src/hermes-agent.ts
import { HermesClient } from './hermes-client';
import { ToolCaller } from './tool-caller';

export class HermesAgent {
  private client: HermesClient;
  private toolCaller: ToolCaller;

  constructor() {
    this.client = new HermesClient();
    this.toolCaller = new ToolCaller();
  }

  async chat(message: string): Promise<string> {
    return await this.client.sendMessage(message);
  }

  reset(): void {
    this.client.clearConversation();
  }

  // Add tool support
  registerTool(tool: any): void {
    this.toolCaller.registerTool(tool);
  }
}
```

### Step 7: Build CLI Interface

Create a command-line interface for testing:

```typescript
// src/cli.ts
import readline from 'readline';
import { HermesAgent } from './hermes-agent';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const agent = new HermesAgent();

console.log('🤖 Hermes Agent Ready! Type your message (or "quit" to exit)\n');

const askQuestion = () => {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'quit') {
      console.log('Goodbye! 👋');
      rl.close();
      return;
    }

    try {
      const response = await agent.chat(input);
      console.log(`\nAssistant: ${response}\n`);
    } catch (error) {
      console.error('Error:', error.message);
    }

    askQuestion();
  });
};

askQuestion();
```

## Examples

### Example 1: Basic Chat Agent

```typescript
import { HermesAgent } from './hermes-agent';

async function main() {
  const agent = new HermesAgent();

  // Simple conversation
  const response1 = await agent.chat('What is TypeScript?');
  console.log(response1);

  const response2 = await agent.chat('Show me an example');
  console.log(response2);

  // Reset conversation
  agent.reset();
}

main();
```

### Example 2: Multi-Turn Dialogue with Context

```typescript
import { HermesAgent } from './hermes-agent';

async function main() {
  const agent = new HermesAgent();

  // The agent maintains context across turns
  await agent.chat('I want to learn about React');
  await agent.chat('What are hooks?');
  await agent.chat('Show me useState example');
  await agent.chat('How about useEffect?');

  // All previous context is preserved
}

main();
```

### Example 3: Agent with Custom Tools

```typescript
import { HermesAgent } from './hermes-agent';

async function main() {
  const agent = new HermesAgent();

  // Register custom tools
  agent.registerTool({
    name: 'calculate',
    description: 'Perform mathematical calculations',
    execute: async ({ expression }) => {
      return eval(expression); // Use safer math parser in production
    },
  });

  const response = await agent.chat('Calculate 25 * 4 + 10');
  console.log(response);
}

main();
```

## Best Practices

### Performance Optimization

- ✅ Use streaming responses for better UX with long outputs
- ✅ Implement request caching for repeated queries
- ✅ Set appropriate `max_tokens` limits based on use case
- ✅ Use lower temperature (0.2-0.5) for factual tasks, higher (0.7-0.9) for creative tasks

### Error Handling

- ✅ Always wrap API calls in try-catch blocks
- ✅ Implement retry logic with exponential backoff
- ✅ Provide fallback responses for critical failures
- ✅ Log errors for debugging and monitoring

### Security

- ✅ Never expose API keys in client-side code
- ✅ Validate and sanitize all user inputs
- ✅ Implement rate limiting to prevent abuse
- ✅ Use HTTPS for all API communications

### Conversation Management

- ✅ Limit conversation history to prevent token overflow
- ✅ Implement conversation summarization for long sessions
- ✅ Allow users to reset/clear conversation context
- ✅ Store conversations securely if persistence is needed

## Common Pitfalls

- **Problem:** Token limit exceeded with long conversations
  **Solution:** Implement sliding window or summarization to manage context length

- **Problem:** Slow response times
  **Solution:** Use streaming, optimize prompt length, consider model quantization

- **Problem:** Hallucinations or incorrect information
  **Solution:** Lower temperature, add fact-checking tools, provide grounding context

- **Problem:** Loss of context in multi-turn conversations
  **Solution:** Ensure proper conversation history formatting and sufficient context window

## Security & Safety Notes

- This skill involves making API calls to LLM endpoints
- Ensure proper authentication and authorization for your Hermes endpoint
- If deploying publicly, implement rate limiting and input validation
- Be cautious with tool execution - validate all inputs before running functions
- Consider content filtering for production deployments

## Related Skills

- `@ai-agent-development` - Broader AI agent development patterns
- `@agent-tool-builder` - Advanced tool/function calling techniques
- `@api-patterns` - RESTful API design for agent services
- `@typescript` - TypeScript best practices and patterns

## Additional Resources

- Hermes Model Documentation: https://nousresearch.com/models
- Ollama Integration Guide: https://ollama.ai/library/hermes
- LangChain.js for advanced agent orchestration
- vLLM for high-performance inference serving
