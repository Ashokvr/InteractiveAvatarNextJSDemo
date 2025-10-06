/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com/v1/streaming";
const API_KEY = process.env.HEYGEN_API_KEY;

if (!API_KEY) console.warn("HEYGEN_API_KEY is not set");

async function heygen<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
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

// POST /api/knowledge/delete
// body: { knowledgeId: string }
export async function POST(req: NextRequest) {
  try {
    const { knowledgeId } = await req.json();

    if (!knowledgeId) {
      return NextResponse.json(
        { error: "knowledgeId is required" },
        { status: 400 }
      );
    }

    const result = await heygen(`/knowledge_base/${knowledgeId}/delete`, {
      method: "POST",
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Delete KB failed:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
