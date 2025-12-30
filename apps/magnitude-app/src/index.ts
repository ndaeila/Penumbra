import { startBrowserAgent } from "magnitude-core";
import z from 'zod';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const agent = await startBrowserAgent({
        // Starting URL for agent
        url: 'https://www.google.com/',
        // Show thoughts and actions
        narrate: true,
        // LLM configuration
        llm: {
            provider: 'claude-code',
            options: {
                model: 'claude-haiku-4-5'
            }
        },
        prompt: `Today is ${new Date().toISOString().split('T')[0]}. 
        You are a helpful assistant that deeply researches the internet to answer questions. 
        Always scroll through the entirety of the page to explore the entire page before answering the question. 
        Always return the full URL of the result, not just the snippet.`,
    });

    let question = 'Nathan Daeila age';

    question = question.replace(/ /g, '+').replace(/'/g, '%27');

    let start = 0;
    let maxPages = 2;

    let allSearchResults = [];

    let parallel = true;

    // Helper function to extract search results from a specific page using an agent
    async function extractSearchResultsFromPage(agentInstance: any, startIndex: number) {
        await agentInstance.nav('https://www.google.com/search?q=' + question + '&udm=14&start=' + startIndex); // Search without AI Overview

        let searchResults = await agentInstance.extract('What are all 10 results on the search results page?', z.array(z.object({
            title: z.string(),
            url: z.string({ message: "URL is required" }),
            googleDescription: z.string({ message: "Google description is required" }),
            significanceToQuestionParagraph: z.string({ message: "Significance to question paragraph is required" }),
        })).length(10, {
            message: "Must return exactly 10 search results",
        }));

        return searchResults;
    }

    // Helper function to create an agent and extract results for a specific page
    async function extractWithNewAgent(startIndex: number) {
        const pageAgent = await startBrowserAgent({
            url: 'https://www.google.com/',
            narrate: true,
            llm: {
                provider: 'claude-code',
                options: {
                    model: 'claude-haiku-4-5'
                }
            },
            prompt: 'Today is ' + new Date().toISOString().split('T')[0] + '. You are a helpful assistant that deeply researches the internet to answer questions.',
        });

        try {
            const results = await extractSearchResultsFromPage(pageAgent, startIndex);
            return results;
        } finally {
            await pageAgent.stop();
        }
    }

    if (parallel) {
        // Parallelize: create multiple agent instances, one per page
        const extractionPromises = [];
        for (let i = 0; i < maxPages; i++) {
            extractionPromises.push(extractWithNewAgent(start + i * 10));
        }
        const results = await Promise.all(extractionPromises);
        allSearchResults.push(...results.flat());
    } else {
        // Sequential: extract one page at a time using the main agent
        for (let i = 0; i < maxPages; i++) {
            const searchResults = await extractSearchResultsFromPage(agent, start);
            allSearchResults.push(...searchResults);
            start += 10; // 10 results per page
        }
    }

    allSearchResults = allSearchResults.concat(allSearchResults);

    // Remove duplicates from search results
    allSearchResults = allSearchResults.filter((result, index, self) =>
        index === self.findIndex((t) => t.url === result.url)
    );

    console.log(allSearchResults.length);

    await agent.act('What is Nathan Daeila\'s age?');
        
    await agent.stop();
}

main();

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
