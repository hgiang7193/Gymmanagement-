# Hermes LLM Models Reference

## Overview

Hermes is a family of open-source instruction-tuned language models developed by Nous Research. These models are optimized for chat, reasoning, tool use, and general instruction following.

## Model Variants

### Hermes 3 (Latest)
- **Base Models**: Llama 3.1 (8B, 70B, 405B)
- **Features**:
  - Improved tool calling and function execution
  - Better instruction following
  - Enhanced reasoning capabilities
  - Multi-turn conversation optimization
- **Best For**: Production chat applications, agent systems

### Hermes 2
- **Base Models**: Llama 2 (7B, 13B, 70B), Mistral (7B)
- **Features**:
  - Strong performance on benchmarks
  - Good balance of speed and quality
  - Well-tested in production
- **Best For**: Resource-constrained environments

## Deployment Options

### 1. Ollama (Local/Development)

```bash
# Install Ollama
brew install ollama  # macOS
# or download from https://ollama.ai

# Pull Hermes model
ollama pull hermes3

# Run locally
ollama run hermes3
```

**API Endpoint**: `http://localhost:11434/api/generate`

### 2. vLLM (Production Inference)

```bash
pip install vllm

# Serve model
python -m vllm.entrypoints.openai.api_server \
  --model NousResearch/Hermes-3-Llama-3.1-8B \
  --port 8000
```

**API Endpoint**: `http://localhost:8000/v1/completions`

### 3. Hugging Face Transformers

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained(
    "NousResearch/Hermes-3-Llama-3.1-8B",
    torch_dtype="auto",
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained("NousResearch/Hermes-3-Llama-3.1-8B")
```

### 4. Cloud Providers

- **Together AI**: API access to hosted Hermes models
- **Fireworks AI**: Fast inference with Hermes
- **Groq**: Ultra-fast inference (LPU-based)

## Prompt Format

Hermes models use a specific chat template:

```
<|im_start|>system
You are a helpful AI assistant.<|im_end|>
<|im_start|>user
Hello! How are you?<|im_end|>
<|im_start|>assistant
I'm doing well, thank you! How can I help you today?<|im_end|>
```

## Configuration Parameters

| Parameter | Range | Description | Recommended |
|-----------|-------|-------------|-------------|
| temperature | 0.0-1.0 | Controls randomness | 0.7 (chat), 0.2 (factual) |
| max_tokens | 1-4096 | Maximum output length | 2048 |
| top_p | 0.0-1.0 | Nucleus sampling | 0.9 |
| top_k | 1-100 | Top-k sampling | 50 |
| repetition_penalty | 1.0-2.0 | Penalize repetition | 1.1 |

## Performance Benchmarks

### Hermes 3 Llama-3.1-8B
- **MT-Bench**: 8.2/10
- **AlpacaEval**: 75th percentile
- **Inference Speed**: ~50 tokens/sec (A100)

### Hermes 3 Llama-3.1-70B
- **MT-Bench**: 8.8/10
- **AlpacaEval**: 85th percentile
- **Inference Speed**: ~15 tokens/sec (A100)

## Best Practices

1. **Use System Prompts**: Always include a clear system prompt to guide behavior
2. **Temperature Tuning**: Lower for factual tasks, higher for creative tasks
3. **Context Window**: Stay within model's context limit (8K for 8B, 128K for 70B)
4. **Stop Sequences**: Use `<|im_end|>` as stop sequence to prevent over-generation

## Resources

- **Official Repository**: https://github.com/NousResearch/Hermes
- **Hugging Face**: https://huggingface.co/NousResearch
- **Documentation**: https://nousresearch.com/models/hermes
- **Discord Community**: https://discord.gg/nous-research
