import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { chunkText } from "@/lib/chunk";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function decodePdfTextToken(token: string): string {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

function extractTextFromPdfData(pdfData: any): string {
  const pages = pdfData?.Pages;
  if (!Array.isArray(pages)) return "";

  const text = pages
    .map((page: any) => {
      const textItems = Array.isArray(page?.Texts) ? page.Texts : [];
      const pageText = textItems
        .map((textItem: any) => {
          const runs = Array.isArray(textItem?.R) ? textItem.R : [];
          return runs
            .map((run: any) => decodePdfTextToken(String(run?.T ?? "")))
            .join("");
        })
        .join(" ")
        .trim();

      return pageText;
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return text;
}

export async function POST(req: NextRequest) {
  let sessionId = req.cookies.get("aii_session")?.value ?? undefined;
  const isNewSession = !sessionId;
  if (!sessionId) sessionId = randomUUID();

  const formData = await req.formData();
  const candidateIdFromForm = (formData.get("candidateId") as string) || "";

  // support both resume + filepond
  const resumeFile = formData.get("resume");
  const filepondAll = formData.getAll("filepond");
  const candidateFile = (resumeFile ??
    (filepondAll && filepondAll[0])) as File | null;

  const candidateId = candidateIdFromForm || uuidv4();

  if (!candidateFile || !(candidateFile instanceof File)) {
    return NextResponse.json(
      { error: "No valid file uploaded." },
      { status: 400 },
    );
  }

  // Save PDF to /tmp and parse
  const fileName = uuidv4();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await candidateFile.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let parsedText = "";
  const pdfParser = new (PDFParser as any)(null, 1);

  try {
    parsedText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData?.parserError ?? new Error("PDF parse error"));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          const extracted = extractTextFromPdfData(pdfData);
          if (extracted) {
            resolve(extracted);
            return;
          }

          const fallback = (pdfParser as any).getRawTextContent?.();
          resolve(typeof fallback === "string" ? fallback : "");
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.loadPDF(tempFilePath);
    });
  } catch (e: any) {
    console.error("PDF parse error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to parse PDF" },
      { status: 400 },
    );
  } finally {
    await fs.unlink(tempFilePath).catch(() => undefined);
  }

  try {
    if (!parsedText.trim()) {
      return NextResponse.json(
        { error: "Could not extract readable text from the uploaded PDF." },
        { status: 400 },
      );
    }

    const chunks = chunkText(parsedText, 1200).filter(
      (chunk) => chunk.trim().length > 0,
    );
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Could not extract readable text from the uploaded PDF." },
        { status: 400 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const rows = chunks.map((chunk, i) => ({
      content: chunk,
      embedding: emb.data[i].embedding,
      candidate_id: candidateId,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    }));

    const supa = supabaseAdmin();
    const { error } = await supa.from("documents").insert(rows);
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Embedding/DB error:", e);
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    parsedText,
    fileName,
    candidateId,
    sessionId,
  });

  if (isNewSession) {
    res.cookies.set("aii_session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });
  }

  return res;
}
