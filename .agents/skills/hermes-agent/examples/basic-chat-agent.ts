/**
 * Example: Basic Hermes Chat Agent
 *
 * This example demonstrates a simple chat agent using the Hermes LLM model.
 * It maintains conversation history and provides contextual responses.
 */

import { HermesAgent } from '../src/hermes-agent';

async function main() {
  console.log('🚀 Starting Hermes Chat Agent...\n');

  const agent = new HermesAgent();

  // Example 1: Simple Q&A
  console.log('--- Example 1: Simple Q&A ---');
  const response1 = await agent.chat('What is TypeScript?');
  console.log(`Assistant: ${response1}\n`);

  // Example 2: Follow-up question (context preserved)
  console.log('--- Example 2: Follow-up Question ---');
  const response2 = await agent.chat('How does it differ from JavaScript?');
  console.log(`Assistant: ${response2}\n`);

  // Example 3: Request for code example
  console.log('--- Example 3: Code Example ---');
  const response3 = await agent.chat('Show me a basic TypeScript interface');
  console.log(`Assistant: ${response3}\n`);

  // Reset conversation
  console.log('--- Resetting Conversation ---');
  agent.reset();
  console.log('Conversation cleared.\n');

  // Example 4: New topic after reset
  console.log('--- Example 4: New Topic ---');
  const response4 = await agent.chat('Explain React hooks');
  console.log(`Assistant: ${response4}\n`);

  console.log('✅ Examples completed!');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
