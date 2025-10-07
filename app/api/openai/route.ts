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
            - Below are the questions needed to extract related to the user information if available:
              1. Can verify the name of your company is {companyname}?                       
              2. What does your company do?
              3. How many employees do you have? 
              4. Can you tell me who’s on your team and how roles are divided, for now, just a simple description in your own words is fine? 
              5. What products and services do you provide? Please provide a list.
              6. Are there any industry standards, regulations, or customer specifications your products or services must follow? 
              7. Do you want to certify all of your products and services?
              8. Are all processes performed in-house, or are some outsourced?
              9. What production capabilities do you have (processes, equipment, etc.)? Please provide a list.
              10. How many locations/sites do you have?
              11. Should the management system cover all locations?
              12. Who will be responsible for the implementation and control of the Quality Management System (QMS)?
              13. What software do you use for processes such as sales, production, and purchasing?
              14. Are your products exported?

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
