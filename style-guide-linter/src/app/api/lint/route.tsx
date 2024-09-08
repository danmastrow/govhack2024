import { type NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import fs from "node:fs";
import path from "node:path";

export type LintRequest = {
  content: string;
};

export type FeedbackItem = {
  relevantText: string;
  styleGuideRuleReferenceName: string;
  suggestion: string;
  comment: string;
};

const styleGuideFileName = "_style_guide_grammar.md";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateResponse(
  context: string,
  prompt: string
): Promise<string> {
  console.log(context);
  console.log(prompt);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a reviewer for the Australian Government Style Guide. You are reviewing a part of a document and providing feedback on the grammar punctuation and conventions, here is its contents '${context}'. Return feedback as json without MD formatting. Format the json as an array, where each object contains the following keys: 'relevantText', 'styleGuideRuleReferenceName', 'suggestion', 'comment'.  relevantText is the original part of the text that the feedback refers to. styleGuideRuleReferenceName is the name of the style guide rule that the feedback refers to. suggestion is the suggested change. comment is an optional field for additional comments. If there are no changes needed for a specific part of the text, don't append any.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content ?? "";
}
async function getStyleGuidance(userInput: string) {
  const dataPath = path.join(
    process.cwd(),
    "src",
    "app",
    "data",
    styleGuideFileName
  );

  const fileContents = fs.readFileSync(dataPath, "utf-8");

  const gptResponse = await generateResponse(fileContents, userInput);

  return gptResponse;
}

export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return new NextResponse(null, { status: 400 });
    }

    const request: LintRequest = await req.json();

    if (request.content === "") {
      return new NextResponse(null, { status: 400 });
    }

    const response = await getStyleGuidance(request.content);
    const responseAsJson = JSON.parse(response) ?? [];
    return NextResponse.json(responseAsJson);
  } catch (error) {
    console.error("Error linting content:", error);
    return new NextResponse(null, { status: 500 });
  }
}
