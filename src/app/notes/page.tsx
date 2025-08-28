"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Notes = {
  title: string;
  sections: { heading: string; bullets: string[] }[];
  key_terms: string[];
  summary: string;
  flashcards: { question: string; answer: string }[];
};

export default function NotesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Notes | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotes(null);
    if (!file) {
      setError("Please select a PDF or PPTX file");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    setIsLoading(true);
    try {
      const res = await fetch("/api/notes/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate notes");
      setNotes(data.notes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Generate Structured Notes</CardTitle>
          <CardDescription>
            Upload a PDF or PPTX. We will extract the content and create concise study notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Document *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Max ~10MB. Supported: PDF, PPTX (PPT not supported yet).
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !file}>
              {isLoading ? "Generating..." : "Generate Notes"}
            </Button>
          </form>

          {notes && (
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold">{notes.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Summary</p>
                <p className="mt-1">{notes.summary}</p>
              </div>

              <div className="space-y-4">
                {notes.sections?.map((s, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold">{s.heading}</h3>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      {s.bullets?.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {!!notes.key_terms?.length && (
                <div>
                  <h3 className="font-semibold">Key Terms</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {notes.key_terms.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-primary/10 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!notes.flashcards?.length && (
                <div>
                  <h3 className="font-semibold">Flashcards</h3>
                  <ul className="mt-2 space-y-2">
                    {notes.flashcards.map((f, i) => (
                      <li key={i} className="border rounded-md p-3">
                        <p className="font-medium">Q: {f.question}</p>
                        <p className="text-sm mt-1">A: {f.answer}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


