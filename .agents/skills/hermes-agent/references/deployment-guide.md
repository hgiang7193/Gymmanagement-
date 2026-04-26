# Hermes Agent Deployment Guide

## Local Development Setup

### Prerequisites

1. Node.js 18+ installed
2. npm or yarn package manager
3. Access to Hermes model endpoint

### Quick Start

```bash
# 1. Create project
mkdir my-hermes-agent && cd my-hermes-agent
npm init -y

# 2. Install dependencies
npm install axios dotenv uuid
npm install --save-dev typescript @types/node ts-node

# 3. Initialize TypeScript
npx tsc --init

# 4. Create .env file
cat > .env << EOF
HERMES_API_URL=http://localhost:11434/api/generate
HERMES_MODEL_NAME=hermes3:latest
HERMES_TEMPERATURE=0.7
HERMES_MAX_TOKENS=2048
EOF

# 5. Install and start Ollama
brew install ollama  # macOS
ollama pull hermes3
ollama serve
```

## Production Deployment Options

### Option 1: Docker Container

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t hermes-agent .
docker run -p 3000:3000 --env-file .env hermes-agent
```

### Option 2: Serverless (Vercel/Netlify)

```typescript
// api/chat.ts (Vercel serverless function)
import { HermesAgent } from '../src/hermes-agent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  try {
    const agent = new HermesAgent();
    const response = await agent.chat(message);
    return res.status(200).json({ response });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### Option 3: Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hermes-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hermes-agent
  template:
    metadata:
      labels:
        app: hermes-agent
    spec:
      containers:
      - name: agent
        image: hermes-agent:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: hermes-agent-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Monitoring & Observability

### Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log each request
logger.info('Chat request received', {
  userId: req.userId,
  messageLength: req.body.message.length,
  timestamp: new Date().toISOString(),
});
```

### Metrics

Track these key metrics:

- **Response Time**: Average time per request
- **Token Usage**: Input/output tokens per request
- **Error Rate**: Percentage of failed requests
- **Active Conversations**: Number of ongoing sessions

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

## Security Considerations

### Environment Variables

Never commit `.env` files. Use secrets management:

```bash
# Vercel
vercel env add HERMES_API_URL

# Kubernetes
kubectl create secret generic hermes-secrets \
  --from-literal=HERMES_API_URL=... \
  --from-literal=API_KEY=...
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);
```

### Input Validation

```typescript
import Joi from 'joi';

const chatSchema = Joi.object({
  message: Joi.string().min(1).max(4096).required(),
  sessionId: Joi.string().uuid().optional(),
});

app.post('/api/chat', async (req, res) => {
  const { error, value } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  // Process valid request...
});
```

## Scaling Strategies

### Horizontal Scaling

- Deploy multiple instances behind a load balancer
- Use sticky sessions for conversation state, or externalize state to Redis

### Caching

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedResponse(cacheKey: string): Promise<string | null> {
  return await redis.get(cacheKey);
}

async function cacheResponse(cacheKey: string, response: string, ttl: number = 3600) {
  await redis.setex(cacheKey, ttl, response);
}
```

### Queue-Based Processing

For high-throughput scenarios, use a message queue:

```typescript
import Bull from 'bull';

const chatQueue = new Bull('chat-queue', process.env.REDIS_URL);

chatQueue.process(async (job) => {
  const { message, sessionId } = job.data;
  const agent = new HermesAgent(sessionId);
  return await agent.chat(message);
});
```

## Cost Optimization

1. **Use Smaller Models**: Hermes 8B is often sufficient for most tasks
2. **Implement Caching**: Cache frequent queries
3. **Batch Requests**: Process multiple requests together when possible
4. **Monitor Usage**: Set up alerts for unusual usage patterns

## Troubleshooting

### Common Issues

**Issue**: Connection timeout to Hermes endpoint
```bash
# Check if Ollama is running
ollama list

# Restart Ollama
ollama serve
```

**Issue**: Out of memory errors
```bash
# Reduce batch size or use smaller model
# Monitor memory usage
docker stats
```

**Issue**: Slow responses
```bash
# Check GPU utilization
nvidia-smi

# Consider using quantized model
ollama pull hermes3:q4_K_M
```

## Support Resources

- GitHub Issues: Report bugs and feature requests
- Discord Community: Get help from other developers
- Documentation: Comprehensive guides and API reference
