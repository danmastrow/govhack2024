import axios from 'axios';
import xml2js from 'xml2js';
import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';

const sitemapUrl = 'https://www.stylemanual.gov.au/sitemap.xml';
const outputDir = './downloaded_pages';
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

async function downloadPage(url: string): Promise<void> {
    try {
        const response = await axios.get(url);
        let filename = url.split('/').pop() || 'index';

        if (!path.extname(filename)) {
            filename += '.html';
        }

        const filePath = path.join(outputDir, filename);

        // Prettify HTML content if it's an HTML file
        let content = response.data;
        if (filename.endsWith('.html')) {
            content = await prettifyHTML(content);
        }

        await fs.writeFile(filePath, content);
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

async function main(): Promise<void> {
    try {
        await fs.mkdir(outputDir, { recursive: true });

        console.log('Downloading sitemap...');
        const sitemapContent = await downloadSitemap(sitemapUrl);

        console.log('Parsing sitemap...');
        const urls = await parseSitemap(sitemapContent);

        console.log(`Found ${urls.length} URLs. Starting download...`);
        await downloadInBatches(urls);

        console.log('All pages downloaded and prettified successfully!');
    } catch (error) {
        console.error('An error occurred:', (error as Error).message);
    }
}

main();