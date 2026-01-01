import type { AgentOptions, BrowserConnectorOptions } from 'magnitude-core';

import dotenv from 'dotenv';
dotenv.config();


/**
 * LiteLLM Gateway Configuration
 * All LLM requests are routed through the local LiteLLM proxy for unified access and observability
 */
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || process.env.LITELLM_MASTER_KEY;
const DEFAULT_MODEL = process.env.LITELLM_DEFAULT_MODEL || 'claude-haiku-4-5';

/**
 * Custom options for Magnitude Agent instances
 */
export type MagnitudeAgentConfig = {
    startingUrl?: string;
    narrate?: boolean;
    prompt?: string;
    model?: string;
}

/**
 * Default prompt for Magnitude agents
 */
const DEFAULT_PROMPT = `Today is ${new Date().toISOString().split('T')[0]}. 
You are a helpful assistant that deeply researches the internet to answer questions. 
Always scroll through the entirety of the page to explore the entire page before answering the question. 
Always return the full URL of the result, not just the snippet.`;

/**
 * Creates BrowserConnectorOptions with defaults that can be overridden
 */
export function createBrowserConnectorOptions(
    config?: Partial<Pick<MagnitudeAgentConfig, 'startingUrl'>>
): BrowserConnectorOptions {
    return {
        url: config?.startingUrl || 'https://www.google.com/',
    };
}

/**
 * Creates AgentOptions configured to use LiteLLM gateway
 * Requires LITELLM_API_KEY or LITELLM_MASTER_KEY environment variable
 */
export function createAgentOptions(
    config?: Partial<MagnitudeAgentConfig>
): AgentOptions {
    if (!LITELLM_API_KEY) {
        throw new Error(
            'LiteLLM API key not found. Please set LITELLM_API_KEY or LITELLM_MASTER_KEY environment variable.'
        );
    }

    return {
        llm: {
            provider: 'openai-generic',
            options: {
                baseUrl: LITELLM_BASE_URL,
                apiKey: LITELLM_API_KEY,
                model: config?.model || DEFAULT_MODEL,
            }
        },
        prompt: config?.prompt || DEFAULT_PROMPT,
    };
}

/**
 * Convenience function to create both browser and agent options at once
 * with consistent configuration
 */
export function createMagnitudeOptions(config?: Partial<MagnitudeAgentConfig>): {
    browserOptions: BrowserConnectorOptions;
    agentOptions: AgentOptions;
} {
    return {
        browserOptions: createBrowserConnectorOptions(config),
        agentOptions: createAgentOptions(config),
    };
}