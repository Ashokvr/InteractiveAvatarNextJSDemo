import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, user } = body; 
    // user = { name, email, contact } passed from frontend

    // 1. Call OpenAI to transform messages into structured Q&A JSON
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // light, fast, good for JSON
      messages: [
        {
          role: "system",
          content: `You are a data parser.
          From the conversation messages, extract Q&A pairs:
          - For Q&A, whenever a user question appears, track the latest related answer given by the user.
            - The answer may not appear immediately after the question — the user might recall and provide it later.
            - Always overwrite earlier answers if a newer one is provided.
            - If no answer is provided by the end of the conversation, use "skip" as the default.
          Return ONLY the Q&A list in this format:
          {
            "qa": [
              {"question": "...", "answer": "..."},
              {"question": "...", "answer": "..."}
            ]
          }`        
        },
        {
          role: "user",
          content: JSON.stringify(messages)
        }
      ],
      temperature: 0
    });

    const structured = completion.choices[0].message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(structured);
    } catch {
      parsed = { qa: [], error: "Invalid JSON from AI", raw: structured };
    }

    // 2. Merge with user-provided metadata
    const payload = {
      "person name": user?.name || "",
      "email": user?.email || "",
      "contact": user?.contact || "",
      qa: parsed.qa || []
    };

    // 3. Forward structured JSON to Zapier
    const res = await fetch("https://hooks.zapier.com/hooks/catch/3019145/u1vlywq/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

    return new Response(JSON.stringify(payload), { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Failed to process and forward", { status: 500 });
  }
}
