import axios from 'axios';
import xml2js from 'xml2js';
import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const sitemapUrl = 'https://www.stylemanual.gov.au/sitemap.xml';
const outputDir = './downloaded_pages';
const combinedFileName = '_style_guide_full.md';
const concurrencyLimit = 5; // Adjust this value based on the server's capacity

interface SitemapUrl {
    loc: string[];
}

interface Sitemap {
    urlset: {
        url: SitemapUrl[];
    };
}

async function downloadSitemap(url: string): Promise<string> {
    const response = await axios.get(url);
    return response.data;
}

async function parseSitemap(xmlContent: string): Promise<string[]> {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent) as Sitemap;
    return result.urlset.url.map(url => url.loc[0]);
}

async function prettifyHTML(content: string): Promise<string> {
    try {
        return await prettier.format(content, { parser: 'html' });
    } catch (error) {
        console.warn('Failed to prettify HTML. Saving original content. ', error);
        return content;
    }
}

// Function to download and process a page, excluding specific classes and IDs
async function downloadPage(url: string): Promise<void> {
    try {
        const response = await axios.get(url);
        let filename = url.split('/').pop() || 'index';

        if (!path.extname(filename)) {
            filename += '.md';
        }

        const filePath = path.join(outputDir, filename);

        // Use JSDOM to parse and manipulate the HTML content
        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        // Remove elements with class "about-page-section" and "about-page-section__field"
        const sectionsToRemove = document.querySelectorAll('.about-page-section, .about-page-section__field');
        sectionsToRemove.forEach((section) => section.remove());

        // Remove element with id "block-webform"
        const blockWebform = document.getElementById('block-webform');
        if (blockWebform) {
            blockWebform.remove();
        }

        // Extract content from the <main> tag
        const mainContent = document.querySelector('main')?.innerHTML;

        if (!mainContent) {
            console.warn(`No <main> content found for ${url}`);
            return;
        }

        // Prettify HTML content if necessary
        const prettifiedContent = await prettifyHTML(mainContent);

        // Convert the cleaned main content HTML to Markdown
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(prettifiedContent);

        await fs.writeFile(filePath, markdown);
        console.log(`Downloaded and prettified: ${url} as ${filename}`);
    } catch (error) {
        console.error(`Failed to download ${url}: ${(error as Error).message}`);
    }
}

async function downloadInBatches(urls: string[]): Promise<void> {
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
        const batch = urls.slice(i, i + concurrencyLimit);
        await Promise.all(batch.map(url => downloadPage(url)));
    }
}

// Function to combine all markdown files into a single file
async function combineDownloadedFiles(): Promise<void> {
    try {
        const files = await fs.readdir(outputDir);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        let combinedContent = '';

        for (const file of markdownFiles) {
            const filePath = path.join(outputDir, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            combinedContent += `${fileContent}\n\n`; // Add two newlines between files
        }

        const combinedFilePath = path.join(outputDir, combinedFileName);
        await fs.writeFile(combinedFilePath, combinedContent);
        console.log(`Combined content saved to ${combinedFilePath}`);
    } catch (error) {
        console.error('Failed to combine downloaded files:', (error as Error).message);
    }
}

// Main function to download and combine
async function main(): Promise<void> {
    try {
        await fs.mkdir(outputDir, { recursive: true });

        console.log('Downloading sitemap...');
        const sitemapContent = await downloadSitemap(sitemapUrl);

        console.log('Parsing sitemap...');
        const urls = await parseSitemap(sitemapContent);
        const filterUrlsByPath = urls.filter(url => url.includes('/grammar-punctuation-and-conventions/types-words'));
        console.log(`Found ${filterUrlsByPath.length} URLs. Starting download...`);
        await downloadInBatches(filterUrlsByPath);

        console.log('All pages downloaded successfully!');

        // Combine all markdown files into one
        await combineDownloadedFiles();
        console.log('All files combined into one!');
    } catch (error) {
        console.error('An error occurred:', (error as Error).message);
    }
}

main();
