import { NextRequest, NextResponse } from "next/server";
import { parseResumeFromPdf } from "../../parse-resume-from-pdf";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Convert Blob to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse the resume
  try {
    const parsedResume = await parseResumeFromPdf(buffer);
    // Here you could insert parsedResume and file into MongoDB
    return NextResponse.json({ message: "Resume parsed!", parsedResume });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
  }
} 