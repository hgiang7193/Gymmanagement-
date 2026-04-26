/**
 * Example: Streaming Chat with Hermes Agent
 *
 * This example shows how to implement streaming responses for better UX
 * with long outputs. Responses appear token-by-token as they're generated.
 */

import axios from 'axios';
import { hermesConfig } from '../src/config';

interface StreamChunk {
  response: string;
  done: boolean;
}

class StreamingHermesClient {
  async sendMessageStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const response = await axios.post(
        hermesConfig.apiUrl.replace('/generate', '/chat'),
        {
          model: hermesConfig.modelName,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: hermesConfig.temperature,
          stream: true,
        },
        {
          responseType: 'stream',
          timeout: 60000,
        }
      );

      // Process streaming response
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => resolve());
        response.data.on('error', reject);
      });

    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }
}

async function main() {
  console.log('🌊 Streaming Chat Example\n');

  const client = new StreamingHermesClient();

  // Simulate typing indicator
  console.log('You: Explain quantum computing in detail\n');
  console.log('Assistant: ');

  let fullResponse = '';

  await client.sendMessageStream(
    'Explain quantum computing in detail',
    (chunk) => {
      process.stdout.write(chunk); // Print chunk without newline
      fullResponse += chunk;
    }
  );

  console.log('\n\n✅ Streaming complete!');
  console.log(`Total response length: ${fullResponse.length} characters`);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
