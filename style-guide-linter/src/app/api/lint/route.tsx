import { type NextRequest, NextResponse } from "next/server";

export type LintRequest = {
  content: string;
};
export async function POST(req: NextRequest) {
  try {
    const request: LintRequest = await req.json();

    return NextResponse.json({});
  } catch (error) {
    console.error("Error linting content:", error);
    return new NextResponse(null, { status: 500 });
  }
}
