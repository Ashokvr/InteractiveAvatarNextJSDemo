import { NextRequest } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: { knowledge_base_id: string } }
) {
  try {
    if (!HEYGEN_API_KEY) throw new Error("API key missing from .env");

    const res = await fetch(
      `${baseApiUrl}/v1/streaming/knowledge_base/${params.knowledge_base_id}`,
      {
        method: "GET",
        headers: { "x-api-key": HEYGEN_API_KEY },
      }
    );

    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return new Response("Failed to fetch knowledge base", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { knowledge_base_id: string } }
) {
  try {
    if (!HEYGEN_API_KEY) throw new Error("API key missing from .env");

    const res = await fetch(
      `${baseApiUrl}/v1/streaming/knowledge_base/${params.knowledge_base_id}/delete`,
      {
        method: "DELETE",
        headers: { "x-api-key": HEYGEN_API_KEY },
      }
    );

    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error deleting knowledge base:", error);
    return new Response("Failed to delete knowledge base", { status: 500 });
  }
}
