import { NextResponse } from "next/server";
import { runOptimization, type OptimizeInput } from "@/lib/optimizer";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = runOptimization();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  let body: OptimizeInput = {};
  try {
    body = (await request.json()) as OptimizeInput;
  } catch {
    body = {};
  }
  const result = runOptimization(body);
  return NextResponse.json(result);
}
