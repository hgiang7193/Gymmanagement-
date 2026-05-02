# DeepSeek Development Helper

DeepSeek/Ollama support is optional. The application does not require it to run.

## Local Setup

Install Ollama and pull a model:

```powershell
ollama pull deepseek-coder:6.7b
```

Create `.env` values only if a local helper script or CLI expects them:

```env
DEEPSEEK_USE_LOCAL=true
DEEPSEEK_MODEL=deepseek-coder:6.7b
DEEPSEEK_BASE_URL=http://localhost:11434
```

Cloud mode should use an API key in a local `.env` file and must not commit secrets.

## Useful Prompts

```text
Review MYFIT-/src/app.js and list route-level authorization risks.
```

```text
Compare MYFIT-/src/db/schema.sql with MYFIT-/src/db/migrations and identify drift.
```

```text
Suggest focused tests for the course enrollment and class check-in flow.
```

## Archive

The older detailed DeepSeek docs are under `docs/archive/root-legacy/DEEPSEEK_*.md`.
