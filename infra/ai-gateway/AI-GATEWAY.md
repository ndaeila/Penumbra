# AI Gateway 

A unified gateway for LLM access, orchestration, and observability. This stack integrates **LiteLLM** for model proxying and **Langfuse** for tracing and evaluation.

## Architecture

- **LiteLLM**: Unified OpenAI-compatible API for all models (Anthropic, OpenAI, etc.)
- **Langfuse**: Observability platform to trace model calls, monitor latency, and track costs.
- **Shared Infrastructure**: Includes Postgres, ClickHouse (analytics), Redis (caching), and MinIO (media storage).

## Quick Start

1. **Environment Setup**:
   ```bash
   cp env.template .env
   # Update .env with your actual ANTHROPIC_API_KEY and other secrets
   ```

2. **Start the Stack**:
   ```bash
   # From the infra/ai-gateway directory
   podman-compose up -d
   ```

3. **Stop the Stack**:
   ```bash
   podman-compose down
   ```

## 🔗 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **LiteLLM API** | `http://localhost:4000` | Bearer Token (see `LITELLM_MASTER_KEY` in `.env`) |
| **LiteLLM UI** | `http://localhost:4000/ui` | Admin interface for key/model management |
| **Langfuse** | `http://localhost:3000` | See `LANGFUSE_INIT_USER_*` in `.env` |
| **MinIO Console** | `http://localhost:9003` | Media/screenshot storage |

## Usage

### Calling Models through the Gateway
Point your applications to the LiteLLM proxy. It will automatically route to the correct provider and send traces to Langfuse.

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" \
  -d '{
    "model": "anthropic/claude-haiku-4-5",
    "messages": [{"role": "user", "content": "Hello AI Gateway!"}]
  }'
```

### Tracing
Every request made through LiteLLM is automatically visible in the **Langfuse Dashboard**. This allows you to inspect prompts, completions, and token usage in real-time.

---
*Refer to the [Cake AI Docs](https://docs.cake.ai/docs/tracing-calls-to-litellm-with-langfuse-1) for advanced tracing configuration.*

