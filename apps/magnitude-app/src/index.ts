import dotenv from 'dotenv';
import { extractSearchResults } from './modules/serp-extractor/search';

dotenv.config();

async function main() {
    let questions = ['allintext:"nathan daeila"', 'Nathan Daeila age', 'Nathan Daeila height'];
    let maxPages = 2;

    let parallel = {
        questions: true,
        pages: false,
    };

    const allSearchResults = await extractSearchResults(
        questions,
        maxPages,
        parallel.questions,
        parallel.pages
    );

    console.log(allSearchResults);
}

main();