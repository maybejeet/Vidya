import JSZip from "jszip";

// Lazy import to avoid type issues and speed up cold starts
async function pdfParse(buffer: Buffer): Promise<{ text: string }> {
  const mod = await import("pdf-parse");
  const fn: any = (mod as any).default ?? (mod as any);
  return fn(buffer);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return (data.text || "").trim();
}

export async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter(
    (p) => p.startsWith("ppt/slides/slide") && p.endsWith(".xml")
  );
  slideFiles.sort((a, b) => {
    const na = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    const nb = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    return na - nb;
  });

  const texts: string[] = [];
  for (const path of slideFiles) {
    const content = await zip.file(path)!.async("string");
    const matches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
    const slideText = matches
      .map((m) =>
        m
          .replace(/<\/?a:t>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
      )
      .join("\n")
      .trim();
    if (slideText) texts.push(slideText);
  }

  return texts.join("\n\n").trim();
}

export function detectFileKind(
  filename: string,
  mime?: string | null
): "pdf" | "pptx" | "unknown" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (
    lower.endsWith(".pptx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "pptx";
  return "unknown";
}


