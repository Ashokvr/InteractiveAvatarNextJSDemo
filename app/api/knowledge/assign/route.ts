/* eslint-disable prettier/prettier */
// app/api/knowledge/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
const HEYGEN_BASE = "https://api.heygen.com/v1/streaming";
const API_KEY = process.env.HEYGEN_API_KEY; // <-- keep server-side

if (!API_KEY) {
  console.warn("HEYGEN_API_KEY is not set");
}

type Payload = {
  name: string;         // e.g., "Jane Doe"
  email: string;        // e.g., "jane@acme.com"
  company: string;      // e.g., "Acme Corp"
  contactNo: string;    // e.g., "+1-555-123-4567"
  opening?: string;     // your supplied opening line for the KB
  onlyFind?: boolean; // NEW

};

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, "").trim();
}
function normalizePhone(phone: string) {
    return phone.replace(/\D/g, ""); // keep only digits
}
function normalizeEmail(email: string) {
    return email.toLowerCase().trim();
}
  

function kbName({ company, name, email, contactNo }: Payload) {
  // CompanyName-Name-Email-ContactNo (exact format you requested)
  return `${company}-${name}-${email}-${contactNo}`;
}

function buildPrompt(p: Payload) {
        // Put anything else you want the assistant to know here.
        // First sentence must welcome with the person's name and company.
    return [
        `Welcome ${p.name} from ${p.company}.Be helpful, concise, and friendly.User details:\n- Name: ${p.name}\n- Company: ${p.company}\n- Email: ${p.email}\n- Contact No: ${p.contactNo},
        You are a guardrailed voice assistant.\nYour exclusive topic is: \"ISO-9001 Quality Management System Development\"must gather all answers for the questions provided without missing any question.\n\nInstructions:\n- Stay on topic only.\n- Collect answers for all questions 
        one by one in the exact order below.\n- Always ask the exact question text shown for each field, confirm if the information is such as name, number, email id \n- If the user has already
        provided a field.\n- Keep responses concise, friendly, and professional.\nAlways reply in the user's language (e.g., if the user speaks Russian, respond in Russian).\n- When all fields are collected, say: \"I have collected all the information. \"\nRequired fields: \n1. Can verify the name of your company is  ${p.company}? 
        \n2 what does your company do?\n3. How many employees do you have? \n4. Can you tell me who’s on your team and how roles are divided, for now, just a simple description in your own words is fine? \n5. What products and services do you provide? Please provide a list.\n6. Are there any industry standards, regulations, or customer specifications your products or services must follow? \n7. Do you want to certify all of your products and services?\n8. Are all processes performed in-house, or are some outsourced?\n9. What production capabilities do you have (processes, equipment, etc.),Please provide a list...?\n10. How many locations/sites do you have?\n11. Should the management system cover all locations?\n12. Who will be responsible for the implementation and control of the Quality Management System (QMS)?\n13. What software do you use for processes such as sales, production, and purchasing?\n14. Are your products exported?`
        ].join("\n\n");
}
async function heygen<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": API_KEY || "",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");

    throw new Error(`Heygen ${path} ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

async function listKnowledgeBases() {
  // GET /knowledge_base/list
  return heygen<{ data: { list: Array<{
    opening: null;
    prompt: null; id: string; name: string 
}> } }>(
    "/knowledge_base/list",
    { method: "GET" }
  );
}

async function createKnowledgeBase(payload: Payload) {
  // POST /knowledge_base/create
  const body = {
    name: kbName(payload),
    opening: payload.opening || `Welcome to ${payload.company}'s assistant.`,
    prompt: buildPrompt(payload),
  };

  return heygen<{ data: {
    opening: null;
    prompt: null;
    name: any; id: string 
} }>("/knowledge_base/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function POST(req: NextRequest) {
    try {
      const payload = (await req.json()) as Payload;
  
      const { data } = await listKnowledgeBases();
  
      const emailNorm = payload.email ? normalizeEmail(payload.email) : "";
      const phoneNorm = payload.contactNo ? normalizePhone(payload.contactNo) : "";
    
      // Find by our convention OR loose match (contains email/phone)
      const match =
        data.list.find((kb) => {
          const n = normalize(kb.name);

          // exact convention: Company-Name-Email-ContactNo
          if (payload.company && payload.name && payload.email && payload.contactNo) {
            const desired = normalize(`${payload.company}-${payload.name}-${payload.email}-${payload.contactNo}`);

            if (n === desired) return true;
          }

          // loose match by email/phone
          return (!!emailNorm && n.includes(emailNorm)) || (!!phoneNorm && n.includes(phoneNorm));
        }) || null;
  
      if (payload.onlyFind) {
          return NextResponse.json({
            found: !!match,
            knowledgeId: match?.id || null,
            name: match?.name || null,
            opening:match?.opening || null,
            prompt: match?.prompt || null,
          });
      }
  
      // ASSIGN (find or create)
      if (match) {
        return NextResponse.json({
          knowledgeId: match.id,
          name: match.name,
          opening:match.opening || null,
          prompt: match.prompt || null,
          created: false,
        });
      }
  
      // Must have all fields to create
      if (!payload.name || !payload.company || !payload.email || !payload.contactNo) {
        return NextResponse.json(
          { error: "Missing fields to create knowledge base." },
          { status: 400 }
        );
      }
  
      const created = await createKnowledgeBase(payload as Required<Payload>);

      return NextResponse.json({
        knowledgeId: created.data.id,
        name: created.data.name,
        opening: created.data.opening || null,
        prompt: created.data.prompt || null,
        created: true,
      });
    } catch (err: any) {
      console.error(err);

      return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
    }
}
