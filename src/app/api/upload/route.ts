import { v4 as uuidv4 } from 'uuid';
import fs from "fs";
import PDFParser from "pdf2json";

import { chunkText } from "@/lib/chunk";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { supabaseAdmin } from "@/lib/supabaseServer";

//handles file uploads
export async function POST(req: NextRequest) {

  //generates a session id
  let sessionId = req.cookies.get('sessionId')?.value;

  if (!sessionId) {
    sessionId = uuidv4();
  }

  const formData = await req.formData();
  const candidateFormId = formData.get("candidateId");
  const resumeFile = formData.get("resume");
  const filepond = formData.get("filepond");
  const candidateFile = File;

  let fileName = "";
  let fullText = "";

  const candidateId = (candidateFormId != null) ? candidateFormId : uuidv4();

  if (candidateFile == null || candidateFile == undefined || (candidateFile instanceof File == null)) {
    return NextResponse.json(
      {error: "Not a valid upload"}, {status: 400}
    );
  }



  //parsing pdf to write to a json file // not sure if this works
  fileName = `${uuidv4()}.pdf`;
  const tempFilePath = `/tmp/${fileName}`;
  const fileBuffer = Buffer.from(await candidateFile.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);


  const pdfParser = new PDFParser();
  const parsedText = await new Promise((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(errData?.parserError ?? "PDF parse error");
    });

    pdfParser.on("pdfParser_dataReady", () => {
      const text = (pdfParser as any).getRawTextContent();
      resolve(text);
    });
  });
  pdfParser.loadPDF(tempFilePath);

  //writing/embedding the chunks into supabase using openai
  try {
    const chunks = chunkText(parsedText, 1200);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks
    });

    const rows = chunks.map((chunk, i) => ({
      content: chunk,
      embedding: emb.data[i].embedding,
      candidate_id: candidateId,
      session_id: sessionId,
      created_at: new Date().toISOString()
    }));

    const supabs = supabaseAdmin();
    const { error } = await supabs.from("documents").insert(rows);
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  }
}