import { Client } from '@elastic/elasticsearch';
import { OpenAI } from 'openai';

import fs from 'node:fs';
import dotenv from 'dotenv';
import type { SearchHit } from '@elastic/elasticsearch/lib/api/types';

// Load environment variables
dotenv.config();

const styleGuideFileName = "_style_guide_full.md";
// Initialize Elasticsearch client
const elasticsearchClient = new Client({
    node: process.env.ELASTIC_URL, // Change this if you're using a managed Elasticsearch service
    auth: {
        username: process.env.ELASTIC_USERNAME ?? "",
        password: process.env.ELASTIC_PASSWORD ?? "",
    },
});

// Initialize OpenAI client

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is stored in the .env file
});



// Step 3: Use OpenAI GPT for Generation
async function generateResponse(context: string, prompt: string): Promise<string> {
    console.log(context)
    console.log(prompt)
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
            role: "system", content: `You are a reviewer for the Australian Government Style Guide. You are reviewing a part of a document and providing feedback on the grammar punctuation and conventions, here is its contents '${context}'. Return feedback as json without MD formatting. Format the json as an array, where each object contains the following keys: 'feedbackReferenceCharacterIndex', 'endfeedbackReferenceCharacterIndex', 'styleGuideRuleReferenceName', 'suggestion', 'comment'. feedbackReferenceCharacterIndex and endfeedbackReferenceCharacterIndex are the start and end character indices of the text that the feedback refers to. styleGuideRuleReferenceName is the name of the style guide rule that the feedback refers to. suggestion is the suggested change. comment is an optional field for additional comments. If there are no changes needed for a specific part of the text, don't append any.`
        },
        { role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 1000,
    });

    return completion.choices[0].message.content ?? "";
}

// Step 4: Combine Retrieval and Generation for RAG
async function getStyleGuidance(userInput: string) {
    // read file _style_guide_full.md 
    const fileContents = fs.readFileSync(styleGuideFileName, 'utf-8');

    const gptResponse = await generateResponse(fileContents, userInput,);

    return gptResponse;
}

async function runExample() {
    if (!process.env.ELASTIC_USERNAME || !process.env.OPENAI_API_KEY) {
        console.error('Please set the ELASTIC_USERNAME and OPENAI_API_KEY environment variables.');
        return;
    }

    if (!fs.existsSync(styleGuideFileName)) {
        console.error(`Please provide a style guide text file named "${styleGuideFileName}" in the root directory.`);
        return;
    }

    // Example user input
    // https://www.ato.gov.au/businesses-and-organisations/starting-registering-or-closing-a-business/starting-your-own-business/before-you-start-a-business
    const userInput = "Once you have started a business, you need to meet specific business obligations. This includes any required registrations or business. You may need an Australian business number (ABN). This unique 11-digit number identifies your business or organisation to the government and community. An ABN has its own set of obligations.";

    // Step 1: Index the style guide (you only need to run this once)
    // await indexStyleGuide(); // Uncomment this line the first time to index the style guide

    // Step 2: Get style guidance from RAG system
    const response = await getStyleGuidance(userInput);

    console.log(response);
}

runExample().catch(console.error);
