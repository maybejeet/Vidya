import { NextRequest, NextResponse } from "next/server";
import {
  detectFileKind,
  extractTextFromPdf,
  extractTextFromPptx,
} from "@/lib/parsers";
import { generateStructuredNotes } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "File is required" }, { status: 400 });

    const kind = detectFileKind(file.name, file.type);
    if (kind === "unknown") {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or PPTX." },
        { status: 400 }
      );
    }

    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    let text = "";
    if (kind === "pdf") text = await extractTextFromPdf(buffer);
    else if (kind === "pptx") text = await extractTextFromPptx(buffer);

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from the file." },
        { status: 422 }
      );
    }

    const notes = await generateStructuredNotes(text);
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    console.error("Notes generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate notes" },
      { status: 500 }
    );
  }
}


