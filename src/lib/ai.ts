import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StructuredNotes {
  title: string;
  sections: Array<{ heading: string; bullets: string[] }>;
  key_terms: string[];
  summary: string;
  flashcards: Array<{ question: string; answer: string }>;
}

export async function generateStructuredNotes(
  rawText: string
): Promise<StructuredNotes> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert note-making assistant. Read the provided content and produce structured study notes as strict JSON with the following shape:
{
  "title": string,
  "sections": [ { "heading": string, "bullets": string[] } ],
  "key_terms": string[],
  "summary": string,
  "flashcards": [ { "question": string, "answer": string } ]
}
Guidelines:
- Be concise and accurate.
- Organize content into 3-7 sections maximum.
- Use short bullet points per section (3-7 bullets each).
- Create 5-10 flashcards that cover key ideas.
- Do not include any additional keys. Use valid JSON only.`;

  const input = rawText.slice(0, 120_000);
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${prompt}\n\n---\nCONTENT:\n${input}`,
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  const content = result.response.text();
  let parsed: StructuredNotes;
  try {
    parsed = JSON.parse(content) as StructuredNotes;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
  return parsed;
}


