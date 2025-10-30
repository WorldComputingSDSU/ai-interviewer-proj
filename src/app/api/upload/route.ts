import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

import fs from "fs";
import PDFParser from "pdf2json";

import { chunkText } from "@/lib/chunk";

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { supabaseAdmin } from "@/lib/supabaseServer";

//handles file uploads
export async function POST(req: NextRequest) {

//generates a session id
  const cookieStore = cookies();
  let sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) {
    sessionId = uuidv4();

    const formData = await req.formData();
  // FINISH THIS PART!!
}



//parsing pdf to write to a json file // not sure if this works
const fileName = `${uuidv4()}.pdf`;
const tempFilePath = `/tmp/${fileName}`;
const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
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