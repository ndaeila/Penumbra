import { BrowserAgent, startBrowserAgent } from "magnitude-core";
import z from 'zod';
import { createMagnitudeOptions } from '../magnitude/options';
import { int } from "zod/v4";

// ========================================================
// Helper functions
// ========================================================

// Helper function to extract search results from a specific page using an agent
async function extractSearchResultsFromPage(agentInstance: BrowserAgent, startIndex: number, question: string) {
    await agentInstance.nav('https://www.google.com/search?q=' + question + '&udm=14&start=' + startIndex); // Search without AI Overview

    let searchResults = await agentInstance.extract('What are all 10 results on the search results page?', z.array(z.object({
        title: z.string(),
        url: z.string({ message: "URL is required" }),
        googleDescription: z.string({ message: "Google description is required" }),
        significanceToQuestionParagraph: z.string({ message: "Significance to question paragraph is required" }),
        confidence: z.number({ message: "Confidence is required" }).describe("Your confidence that the result is relevant to the question, double precision number between 0 and 1").lt(1).gt(0),
    })).length(10, {
        message: "Must return exactly 10 search results",
    }));

    searchResults = searchResults.map(result => ({
        ...result,
        question: decodeURIComponent(question),
    }));

    return searchResults;
}

// Helper function to create an agent and extract results for a specific page (fully parallel mode)
async function extractWithNewAgent(startIndex: number, question: string) {
    const parallelAgent: BrowserAgent = await createExtractorAgent();

    try {
        const results = await extractSearchResultsFromPage(parallelAgent, startIndex, question);
        return results;
    } finally {
        await parallelAgent.stop();
    }
}

// Helper function to extract all pages for a single question sequentially (preserves context)
async function extractAllPagesForQuestion(question: string, maxPages: number, startIndex: number = 0) {
    const agent: BrowserAgent = await createExtractorAgent();
    const results = [];

    try {
        for (let i = 0; i < maxPages; i++) {
            const pageResults = await extractSearchResultsFromPage(agent, startIndex + i * 10, question);
            results.push(...pageResults);
        }
        return results;
    } finally {
        await agent.stop();
    }
}

// Helper function to create a default agent
async function createExtractorAgent(): Promise<BrowserAgent> {
    const defaultOptions = createMagnitudeOptions({
        prompt: `Today is ${new Date().toISOString().split('T')[0]}. 
        You are a helpful assistant that deeply researches the internet to answer questions. 
        Always scroll through the entirety of the page to explore the entire page before answering the question. 
        Always return the full URL of the result, not just the snippet.`,
        // baseUrl: 'https://api.anthropic.com/v1',
        // provider: 'openai-generic',
        // model: 'claude-haiku-4-5',
    });
    
    return await startBrowserAgent({
        ...defaultOptions.browserOptions,
        ...defaultOptions.agentOptions,
        narrate: true,
    });
}

function googleURLQueryFormatter(question: string): string {
    return encodeURIComponent(question);
}

// ========================================================
// Exported functions
// ========================================================
export async function extractSearchResults(
    questions: string[], 
    maxPages: number = 2, 
    parallelQuestions: boolean = true, 
    parallelPages: boolean = true
) {
    let start = 0;
    let allSearchResults = [];

    if (questions.length === 0) {
        throw new Error('No questions provided');
    }

    if (parallelQuestions && parallelPages) {
        // Mode 1: Fully parallel - separate agent for every page of every question
        // Fastest but no context preservation between pages
        const extractionPromises = [];
        for (let i = 0; i < questions.length; i++) {
            for (let j = 0; j < maxPages; j++) {
                extractionPromises.push(extractWithNewAgent(start + j * 10, googleURLQueryFormatter(questions[i]!)));
            }
        }
        const results = await Promise.all(extractionPromises);
        allSearchResults.push(...results.flat());
        
    } else if (parallelQuestions && !parallelPages) {
        // Mode 2: HYBRID - questions in parallel, but pages sequential within each question
        // Preserves context between pages while parallelizing across questions
        const questionPromises = questions.map(question => 
            extractAllPagesForQuestion(googleURLQueryFormatter(question), maxPages, start)
        );
        const results = await Promise.all(questionPromises);
        allSearchResults.push(...results.flat());
        
    } else {
        // Mode 3: Fully sequential - one agent processes everything in order
        // Slowest but maximum context preservation
        const agent: BrowserAgent = await createExtractorAgent();
        try {
            for (let i = 0; i < questions.length; i++) {
                for (let j = 0; j < maxPages; j++) {
                    const searchResults = await extractSearchResultsFromPage(agent, start + j * 10, googleURLQueryFormatter(questions[i]!));
                    allSearchResults.push(...searchResults);
                    start += 10; // 10 results per page
                }
            }
        } finally {
            await agent.stop();
        }
    }

    allSearchResults = allSearchResults.concat(allSearchResults);

    // Remove duplicates from search results
    allSearchResults = allSearchResults.filter((result, index, self) =>
        index === self.findIndex((t) => t.url === result.url)
    );

    return allSearchResults;
}



    // // Intelligently extract data based on the DOM content matching a provided zod schema
    // const gettingStarted = await agent.extract('Extract how to get started with Magnitude', z.object({
    //     // Agent can extract existing data or new insights
    //     difficulty: z.enum(['easy', 'medium', 'hard']),
    //     steps: z.array(z.string()),
    // }));

    // // // Navigate to a new URL
    // // await agent.nav('https://magnitasks.com');

    // // Magnitude can handle high-level tasks
    // await agent.act('Create a task', { 
    //     // Optionally pass data that the agent will use where appropriate
    //     data: { 
    //         title: 'Get started with Magnitude', 
    //         description: gettingStarted.steps.map(step => `• ${step}`).join('\n') 
    //     } 
    // });

    // // It can also handle low-level actions
    // await agent.act('Drag "Get started with Magnitude" to the top of the in progress column');

    // Stop agent and browser
