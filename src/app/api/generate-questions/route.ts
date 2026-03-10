import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
    try{
        const sessionId = req.cookies.get("aii_session")?.value;
        if (!sessionId) {
            return NextResponse.json(
            { error: "Session id does not exist." },
            { status: 400 }
        );
    }

    const supa = supabaseAdmin();

    //gets resume and verifies session id
    const query = supa
    .from("documents")
    .select("content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(4);

    if (sessionId) query.eq("session_id", sessionId);

    const { data, error } = await query;
    if (error) {
        console.error("Supabase Fetch Error", error);
        return NextResponse.json(
            { error: "Failed to fetch resume data" },
            { status: 500 }
        );
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Resume not found. Please reupload your resume." },
        { status: 404 }
      );
    }

    const resumeContent = data
      .map((d) => d.content ?? "")
      .join("\n\n")
      .slice(0, 6000);

      const openai = openaiClient();


    const prompt = [`
        You are an expert ATS and staff recruiter.
        Your job is to analyze the provided resume against the job description and
        craft 2 behavioral questions and 3 technical questions.
        Make these questions tailored to the resume and job description.
        Avoid crafting any yes/no questions.

        Return ONLY valid JSON.
        Do NOT wrap in markdown.
        Do NOT include backticks.
        Do NOT include explanations outside JSON.
        Do NOT add trailing commas.`
    ].join(" ");

    const user = [
        "Resume summary below:\n",
        "----- RESUME START -----\n",
        resumeContent,
        "\n----- RESUME END -----\n",
        'Return JSON with shape: { "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"] }',
        "Only produce valid JSON.",
    ].join("");

    // call to openai to input prompt and resume
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });

    const rawOutput = completion.choices?.[0]?.message?.content ?? "{}";
    let parsed: { questions?: string[] } = {};
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      parsed = { questions: [] };
    }

    // Final guard: ensure 5 strings
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q) => typeof q === "string").slice(0, 5)
      : [];

    if (questions.length !== 5) {
      return NextResponse.json(
        { error: "Model did not return 5 questions.", rawOutput },
        { status: 502 }
      );
    }

    //Return Questions
    return NextResponse.json({ questions });

    //Catch Errors
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown Error Occurred" },
      { status: 500 }
    );
  }
}

}