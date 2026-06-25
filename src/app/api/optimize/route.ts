import { NextResponse } from "next/server";
import { runOptimization, type OptimizeInput } from "@/lib/optimizer";

export const dynamic = "force-dynamic";

export async function GET() {
  const seed = Math.floor(Math.random() * 1000000);
  const result = runOptimization({ seed });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  let body: OptimizeInput = {};
  try {
    body = (await request.json()) as OptimizeInput;
  } catch {
    body = {};
  }
  const seed = body.seed ?? Math.floor(Math.random() * 1000000);
  const result = runOptimization({ ...body, seed });
  return NextResponse.json(result);
}
