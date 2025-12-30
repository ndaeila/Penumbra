import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { startBrowserAgent } from 'magnitude-core';
import z from 'zod';

@Injectable()
export class MagnitudeService implements OnModuleInit {
  private readonly logger = new Logger(MagnitudeService.name);

  onModuleInit() {
    this.logger.log('MagnitudeService initialized');
  }

  async extractSearchResults(query: string) {
    const agent = await startBrowserAgent({
      url: 'https://www.google.com/',
      narrate: true,
      llm: {
        provider: 'claude-code',
        options: {
          model: 'claude-haiku-4-5',
        },
      },
      prompt: `Today is ${new Date().toISOString().split('T')[0]}. You are a helpful assistant that deeply researches the internet to answer questions. IGNORE the AI Overview from Google and focus on investigating the question yourself. Always scroll through the entirety of the page to explore the entire page before answering the question. Always return the full URL of the result, not just the snippet.`,
    });

    await agent.nav(`https://www.google.com/search?q=${query}`);

    const searchResults = await agent.extract(
      'What are all 10 results on the search results page?',
      z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          googleDescription: z.string(),
          significanceToQuestionParagraph: z.string(),
        }),
      ).length(10),
    );
  }
}
