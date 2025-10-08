/* eslint-disable prettier/prettier */
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages,extractedPrompt } = await req.json();
    
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            You are a data parser.
            From the conversation messages, extract every question asked by avatar only and pair it with the most recent user-provided answer.
            Rules:
            - Always output JSON only in this format:
              {
                "qa": [
                  {"question": "string", "answer": "string"},
                  ...
                ]
              }
            - Do not include commentary or markdown.
            - If a question has no answer, use "-".
            - Ensure answers are clean and grammatically correct.
            - Use the user messages to identify if the user has added or modified any information.
            - If the user’s latest message clearly updates or changes an answer, replace the previous answer with the new one.
            - If the user’s message does not mention or modify an existing answer, keep the previous answer as-is.
            - If a question was previously unanswered and the user now provides an answer, add it.
            - Never delete existing questions or answers.
            - Return all existing answers along with any newly added or updated ones.
            - Maintain the same question order as in the original data.
            Reference Prompt (Existing Context):
            ${extractedPrompt}
            Additional Linguistic Extraction and Generation Rules:
            - When the question requires linguistic analysis or generation, identify and classify words according to their parts of speech:
              - Nouns: Names of a person, place, thing, idea, or concept.
              - Pronouns: Words that replace nouns.
              - Verbs: Words expressing an action, occurrence, or state of being.
              - Adjectives: Words describing or modifying nouns or pronouns.
              - Adverbs: Words modifying verbs, adjectives, or other adverbs.
              - Prepositions: Words showing relationships (location, direction, etc.).
              - Conjunctions: Words joining words, phrases, or clauses.
              - Interjections: Words or short phrases expressing emotion or grabbing attention.
            - If the question expects a single word, return only that word of the correct part of speech.
            - If the question expects a statement or sentence, generate a complete, grammatically correct sentence that demonstrates the appropriate word types.
            - Always ensure answers are contextually accurate, meaningful, and concise.
            - Maintain JSON structure consistency when including generated linguistic content.

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
