import { NextResponse } from "next/server";
import { runOptimization, type OptimizeInput } from "@/lib/optimizer";
import { generateReport } from "@/lib/watsonx";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: OptimizeInput = {};
  try {
    body = (await request.json()) as OptimizeInput;
  } catch {
    body = {};
  }
  const result = runOptimization(body);
  const report = await generateReport(result);
  return NextResponse.json({ report });
}

export async function GET() {
  const result = runOptimization();
  const report = await generateReport(result);
  return NextResponse.json({ report });
}
