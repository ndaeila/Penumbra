import dotenv from 'dotenv';
dotenv.config(); 

import { extractSearchResults } from '../modules/serp-extractor/search';

async function main() {
    let questions = ['allintext:"Nicole daeila"', 'Nicole Daeila age', 'Nicole Daeila height'];
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