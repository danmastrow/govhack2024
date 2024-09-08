# AI-Powered Australian Style Guide Linter

![Project Screenshot](image.png)

## Overview

This project aims to leverage AI technologies to enhance the application of the Australian Government Style Manual, making government content more clear, accurate, and user-friendly. It consists of two main components:

1. `style-guide-scraper`: A Node.js application that parses the Australian Style Guide XML.
2. `style-guide-linter`: A Next.js application that allows users to input text and receive AI-powered suggestions based on the Style Guide's grammar rules.

## Original Challenge

> How can we use AI to create clear, accurate and user-friendly government content? Specifically, how can we use AI tools to apply Australian Government Style Manual (Style Manual) rules and guidelines to create, edit and review content? Content that is clear, accurate and understandable helps people make informed decisions and comply with their obligations.

The Australian Government Style Manual is a crucial resource for ensuring consistency and clarity in government communications. This project addresses the challenge by:

- Centering government communication around people's needs
- Adhering to Australian style, spelling, and conventions
- Making content accessible to diverse audiences

## Key Features

- **AI-Powered Linting**: Utilizes ChatGPT with a system prompt formatted from the grammar/punctuation/words subsection of the Style Guide.
- **Real-time Feedback**: Highlights areas for improvement in user-submitted text.
- **Updateable Dataset**: Can be kept current by rerunning the scraper on the latest Style Guide.

## Project Structure

### style-guide-scraper

A Node.js application that:
- Pulls down specific pages from the Style Guide sitemap
- Removes HTML and converts content to markdown for easy parsing by OpenAI

### style-guide-linter

A Next.js application that:
- Provides a user interface for text input
- Calls OpenAI API with the style guide markdown file
- Highlights suggested changes based on grammar rules

## Future Enhancements

- Browser Extension: For seamless integration into writing workflows
- GovCMS Integration: Automatic review of content during submission
- Specific Rule Linking: Direct references to Style Guide sections


This project was developed as part of GovHack 2024, addressing the challenge of improving government communication through AI technologies.