/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com/v1/streaming"; // ✅ correct base for KB updates
const API_KEY = process.env.HEYGEN_API_KEY;

if (!API_KEY) console.warn("HEYGEN_API_KEY is not set");

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
    if (res.status === 404) {
      throw new Error(`Knowledge base not found. Verify ID and permissions.`);
    }
    throw new Error(`Heygen ${path} ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { knowledgeId, name, opening, prompt } = await req.json();

    if (!knowledgeId) {
      return NextResponse.json(
        { error: "knowledgeId is required" },
        { status: 400 },
      );
    }

    const body: Record<string, any> = {
      knowledge_base_id: knowledgeId,
    };
    if (name) body.name = name;
    if (opening) body.opening = opening;
    if (prompt) body.prompt = prompt;

    const result = await heygen(`/knowledge_base/${knowledgeId}`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Update KB failed:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
