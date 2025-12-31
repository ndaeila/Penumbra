import type { AgentOptions, BrowserConnectorOptions } from 'magnitude-core';

/**
 * Custom options for Magnitude Agent instances
 */
export type MagnitudeAgentConfig = {
    startingUrl?: string;
    narrate?: boolean;
    prompt?: string;
    apiKey?: string;
    model?: string;
    provider?: 'anthropic' | 'openai' | 'openai-generic';
    baseUrl?: string;
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
 * Creates AgentOptions with pre-vetted defaults that can be overridden
 * API key will be read from ANTHROPIC_API_KEY environment variable if not provided
 */
export function createAgentOptions(
    config?: Partial<MagnitudeAgentConfig>
): AgentOptions {
    // Get API key from config or environment variable
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        throw new Error(
            'Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable or provide apiKey in config.'
        );
    }

    return {
        llm: {
            provider: config?.provider || 'anthropic',
            options: {
                apiKey,
                model: config?.model || 'claude-haiku-4-5',
                baseUrl: config?.baseUrl || undefined,
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