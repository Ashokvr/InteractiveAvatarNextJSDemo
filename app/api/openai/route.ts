/* eslint-disable prettier/prettier */
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            You are a data parser.
            From the conversation messages, extract every question asked and pair it with the most recent user-provided answer.

            Rules:
            - Always output JSON only in this format:
              {
                "qa": [
                  {"question": "string", "answer": "string"},
                  ...
                ]
              }
            - Do not include commentary or markdown.
            - If a question has no answer, use "skip".
            - Ensure answers are clean and grammatically correct.
          `,
        },
        { role: "user", content: JSON.stringify(messages) },
      ],
      temperature: 0,
    });

    let structured = completion.choices?.[0]?.message?.content?.trim() || "{}";

    // Remove ```json ... ``` if the model adds it
    structured = structured.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(structured);
    } catch (err) {
      parsed = { qa: [], error: "Invalid JSON", raw: structured };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Parse failed:", err);
    return NextResponse.json({ error: "Failed to parse conversation" }, { status: 500 });
  }
}
