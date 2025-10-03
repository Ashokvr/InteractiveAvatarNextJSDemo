// app/api/stop-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com/v1/streaming";
const API_KEY = process.env.HEYGEN_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();

    const res = await fetch(`${HEYGEN_BASE}/stop`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": API_KEY || "",
      },
      body: JSON.stringify({ session_id }),
    });

    if (!res.ok) {
      throw new Error(`Failed to stop: ${res.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
