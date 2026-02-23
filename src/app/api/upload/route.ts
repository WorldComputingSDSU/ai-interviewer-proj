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
      { status: 400 }
    );
  }

  // Save PDF to /tmp and parse
  const fileName = uuidv4();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await candidateFile.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let parsedText = "";
  const pdfParser = new (PDFParser as any)(null, 1);
  await new Promise<void>((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData: any) =>
      reject(errData?.parserError ?? "PDF parse error")
    );
    pdfParser.on("pdfParser_dataReady", () => {
      parsedText = (pdfParser as any).getRawTextContent();
      resolve();
    });
    pdfParser.loadPDF(tempFilePath);
  });

  try {
    const chunks = chunkText(parsedText, 1200);
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
      { status: 500 }
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