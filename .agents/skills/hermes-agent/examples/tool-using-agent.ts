/**
 * Example: Tool-Using Hermes Agent
 *
 * This example demonstrates an agent that can call external tools/functions
 * to perform actions like calculations, data retrieval, etc.
 */

import { HermesAgent } from '../src/hermes-agent';

// Define custom tools
const calculatorTool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    expression: { type: 'string', description: 'Math expression to evaluate' }
  },
  execute: async ({ expression }: { expression: string }) => {
    // Use a safe math evaluator in production (not eval!)
    // This is simplified for demonstration
    try {
      const result = Function('"use strict"; return (' + expression + ')')();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: 'Invalid expression' };
    }
  },
};

const weatherTool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    location: { type: 'string', description: 'City name or coordinates' }
  },
  execute: async ({ location }: { location: string }) => {
    // In production, call actual weather API
    // This simulates a weather API response
    const mockWeatherData = {
      location,
      temperature: Math.floor(Math.random() * 35) + 5,
      condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 100),
    };

    return mockWeatherData;
  },
};

const timeTool = {
  name: 'get_current_time',
  description: 'Get current date and time',
  parameters: {},
  execute: async () => {
    return {
      timestamp: new Date().toISOString(),
      formatted: new Date().toLocaleString(),
    };
  },
};

async function main() {
  console.log('🔧 Tool-Using Agent Example\n');

  const agent = new HermesAgent();

  // Register tools
  agent.registerTool(calculatorTool);
  agent.registerTool(weatherTool);
  agent.registerTool(timeTool);

  console.log('Registered tools:', agent.getAvailableTools().map(t => t.name));
  console.log('\n--- Test 1: Calculator ---');

  const response1 = await agent.chat('Calculate 125 * 8 + 42');
  console.log(`Response: ${response1}\n`);

  console.log('--- Test 2: Weather ---');
  const response2 = await agent.chat("What's the weather in Paris?");
  console.log(`Response: ${response2}\n`);

  console.log('--- Test 3: Current Time ---');
  const response3 = await agent.chat('What time is it now?');
  console.log(`Response: ${response3}\n`);

  console.log('✅ Tool examples completed!');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
