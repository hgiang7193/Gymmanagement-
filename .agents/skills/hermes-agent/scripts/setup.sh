#!/bin/bash

# Hermes Agent Setup Script
# This script sets up a new project with the Hermes agent template

set -e  # Exit on error

echo "🚀 Setting up Hermes Agent Project..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Get project name
PROJECT_NAME=${1:-"my-hermes-agent"}
echo "Project name: $PROJECT_NAME"
echo ""

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize npm project
echo "📦 Initializing npm project..."
npm init -y > /dev/null 2>&1

# Install dependencies
echo "📥 Installing dependencies..."
npm install axios dotenv uuid > /dev/null 2>&1
npm install --save-dev typescript @types/node ts-node @types/uuid > /dev/null 2>&1

# Initialize TypeScript
echo "⚙️  Initializing TypeScript configuration..."
npx tsc --init --target ES2020 --module commonjs --outDir dist --rootDir src --esModuleInterop --strict --skipLibCheck > /dev/null 2>&1

# Create directory structure
mkdir -p src examples

# Create .env file
echo "🔧 Creating environment configuration..."
cat > .env << EOF
# Hermes API Configuration
HERMES_API_URL=http://localhost:11434/api/generate
HERMES_MODEL_NAME=hermes3:latest
HERMES_TEMPERATURE=0.7
HERMES_MAX_TOKENS=2048

# Server Configuration (optional)
PORT=3000
EOF

# Create .gitignore
cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
.DS_Store
EOF

# Create package.json scripts
echo "📝 Updating package.json scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  start: 'ts-node src/index.ts',
  build: 'tsc',
  dev: 'ts-node-dev --respawn src/index.ts',
  example:basic: 'ts-node examples/basic-chat-agent.ts',
  example:streaming: 'ts-node examples/streaming-chat.ts',
  example:tools: 'ts-node examples/tool-using-agent.ts'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Copy example files from skill
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -d "$SKILL_DIR/examples" ]; then
    echo "📋 Copying example files..."
    cp "$SKILL_DIR/examples"/*.ts examples/ 2>/dev/null || true
fi

# Create basic src files
echo "🏗️  Creating source files..."

cat > src/config.ts << 'EOF'
import dotenv from 'dotenv';
dotenv.config();

export const hermesConfig = {
  apiUrl: process.env.HERMES_API_URL || 'http://localhost:11434/api/generate',
  modelName: process.env.HERMES_MODEL_NAME || 'hermes3:latest',
  temperature: parseFloat(process.env.HERMES_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.HERMES_MAX_TOKENS || '2048'),
};
EOF

cat > src/conversation-manager.ts << 'EOF'
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
    this.messages.push({ role, content, timestamp: Date.now() });
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
    return this.messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
  }
}
EOF

cat > src/hermes-client.ts << 'EOF'
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
        { timeout: 30000 }
      );

      const assistantResponse = response.data.response;
      this.conversationManager.addMessage('assistant', assistantResponse);
      return assistantResponse;
    } catch (error) {
      console.error('Error calling Hermes API:', error);
      throw new Error('Failed to get response from Hermes model');
    }
  }

  private buildPrompt(currentMessage: string): string {
    const systemPrompt = 'You are a helpful AI assistant powered by Hermes. Be concise, accurate, and helpful.';
    const history = this.conversationManager.formatForPrompt();
    return `${systemPrompt}\n\n${history}\n\nUSER: ${currentMessage}\nASSISTANT:`;
  }

  clearConversation(): void {
    this.conversationManager.clearHistory();
  }
}
EOF

cat > src/hermes-agent.ts << 'EOF'
import { HermesClient } from './hermes-client';

export class HermesAgent {
  private client: HermesClient;

  constructor() {
    this.client = new HermesClient();
  }

  async chat(message: string): Promise<string> {
    return await this.client.sendMessage(message);
  }

  reset(): void {
    this.client.clearConversation();
  }
}
EOF

cat > src/index.ts << 'EOF'
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
EOF

# Create README
cat > README.md << EOF
# $PROJECT_NAME

A Hermes-powered AI chat agent built with TypeScript.

## Getting Started

### Prerequisites

- Node.js 18+
- Ollama (for local Hermes model) or access to Hermes API endpoint

### Installation

\`\`\`bash
npm install
\`\`\`

### Setup Hermes Model

\`\`\`bash
# Install Ollama: https://ollama.ai
ollama pull hermes3
ollama serve
\`\`\`

### Run the Agent

\`\`\`bash
# Interactive CLI
npm start

# Run examples
npm run example:basic
npm run example:streaming
npm run example:tools
\`\`\`

## Configuration

Edit \`.env\` file to configure the Hermes endpoint:

\`\`\`
HERMES_API_URL=http://localhost:11434/api/generate
HERMES_MODEL_NAME=hermes3:latest
HERMES_TEMPERATURE=0.7
HERMES_MAX_TOKENS=2048
\`\`\`

## Examples

- **basic-chat-agent.ts**: Simple chat with conversation history
- **streaming-chat.ts**: Streaming responses for better UX
- **tool-using-agent.ts**: Agent with custom tool/function calling

## Learn More

- [Hermes Models](https://nousresearch.com/models)
- [Ollama Documentation](https://ollama.ai)
EOF

echo ""
echo "✅ Project setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. Install Ollama and pull Hermes model: ollama pull hermes3"
echo "  3. Start Ollama: ollama serve"
echo "  4. Run the agent: npm start"
echo ""
echo "Happy coding! 🎉"
