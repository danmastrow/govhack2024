import { Client } from '@elastic/elasticsearch';
import { OpenAI } from 'openai';

import fs from 'node:fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Elasticsearch client
const elasticsearchClient = new Client({
    node: process.env.ELASTIC_URL, // Change this if you're using a managed Elasticsearch service
    auth: {
        username: process.env.ELASTIC_USERNAME ?? "", // Change to your Elastic username
        password: process.env.ELASTIC_PASSWORD ?? "", // Change to your Elastic password
    },
});

// Initialize OpenAI client

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is stored in the .env file
});

// Step 1: Index the Style Guide into Elasticsearch
async function indexStyleGuide() {
    const styleGuideContent = fs.readFileSync('styleGuide.txt', 'utf-8'); // Make sure to have the style guide content in this file
    const paragraphs = styleGuideContent.split('\n\n'); // Split content into paragraphs

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];

        await elasticsearchClient.index({
            index: 'style-guide',
            id: i.toString(),
            body: {
                content: paragraph,
            },
        });
    }

    console.log('Style guide indexed successfully.');
}

// Step 2: Query Elasticsearch for Relevant Sections
async function retrieveRelevantSections(query: string) {
    const response = await elasticsearchClient.search({
        index: 'style-guide',
        body: {
            query: {
                match: {
                    content: query, // Match user query with style guide content
                },
            },
        },
    });

    // Return the relevant sections of the guide
    return response.hits.hits.map((hit: any) => hit._source.content);
}

// Step 3: Use OpenAI GPT for Generation
async function generateResponse(prompt: string): Promise<string> {
    const response = await openai.createCompletion({
        model: 'gpt-4', // Use GPT-4 or GPT-3.5 based on availability
        prompt: prompt,
        temperature: 0,
        max_tokens: 500,
    });

    return response.data.choices[0].text || '';
}

// Step 4: Combine Retrieval and Generation for RAG
async function getStyleGuidance(userInput: string) {
    // Retrieve relevant sections from Elasticsearch
    const relevantSections = await retrieveRelevantSections(userInput);

    // Formulate the prompt for GPT
    const prompt = `Based on the following Australian Government Style Guide sections:\n\n${relevantSections.join(
        '\n\n'
    )}\n\nAnswer this query: ${userInput}`;

    // Generate a response using OpenAI GPT
    const gptResponse = await generateResponse(prompt);

    return gptResponse;
}

async function runExample() {

    if (!process.env.ELASTIC_USERNAME || !process.env.OPENAI_API_KEY) {
        console.error('Please set the ELASTIC_USERNAME and OPENAI_API_KEY environment variables.');
        return;
    }

    if (!fs.existsSync('styleGuide.txt')) {
        console.error('Please provide a style guide text file named styleGuide.txt.');
        return;
    }

    const userInput = 'What is the correct Australian spelling for "color"?';

    // Step 1: Index the style guide (you only need to run this once)
    await indexStyleGuide(); // Uncomment this line the first time to index the style guide

    // Step 2: Get style guidance from RAG system
    const response = await getStyleGuidance(userInput);

    console.log('Generated Response:', response);
}

runExample().catch(console.error);
