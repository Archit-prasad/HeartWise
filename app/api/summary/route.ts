import { NextRequest } from "next/server";

interface TranscriptMessage {
  sender: "user" | "ai";
  text: string;
  kind?: "guardrail";
}

const SUMMARY_SYSTEM_PROMPT = `You are HeartWise's session-summary engine. Given a relationship-coaching conversation transcript between a user and HeartWise, produce a concise, genuinely personalized session summary.

Respond with ONLY valid JSON (no markdown code fences, no commentary, no text outside the JSON object) matching this exact shape:
{
  "journey": string,        // 1-3 sentence recap of what was specifically discussed today, referencing real details from the conversation
  "insights": string[],     // 2-3 personalized key insights specific to their situation, not generic relationship advice
  "actionItems": string[],  // 3-4 clear, concrete next steps tailored to what they're actually going through
  "resources": [{ "title": string, "note": string }] // 2-3 relevant resources or concepts matching their specific path (wooing someone new, ending a relationship, or navigating a complicated one)
}`;

export async function POST(request: NextRequest) {
  const { transcript } = (await request.json()) as { transcript: TranscriptMessage[] };

  const userMessages = (transcript ?? []).filter(
    (m) => m.sender === "user" && m.kind !== "guardrail"
  );

  if (userMessages.length === 0) {
    return Response.json({ error: "No conversation to summarize" }, { status: 400 });
  }

  const conversation = (transcript ?? [])
    .filter((m) => m.kind !== "guardrail")
    .map((m) => `${m.sender === "user" ? "User" : "HeartWise"}: ${m.text}`)
    .join("\n");

  const messages = [
    { role: "system", content: SUMMARY_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Conversation transcript:\n\n${conversation}\n\nGenerate the session summary now in the required JSON format.`,
    },
  ];

  let upstream: Response;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "HeartWise",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages,
        stream: false,
      }),
    });
  } catch (err) {
    console.error("[api/summary] fetch to OpenRouter threw:", err);
    return Response.json({ error: "Failed to reach the AI service" }, { status: 502 });
  }

  if (!upstream.ok) {
    const errorBody = await upstream.text().catch(() => "<unable to read body>");
    console.error(
      `[api/summary] OpenRouter rejected the request: status=${upstream.status}`,
      "body:",
      errorBody
    );
    return Response.json({ error: "AI service rejected the request" }, { status: 502 });
  }

  const data = await upstream.json();
  const rawContent: string = data.choices?.[0]?.message?.content ?? "";
  const cleaned = rawContent
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.insights)) {
      parsed.insights = parsed.insights.filter((s: unknown) => typeof s === "string" && s.trim());
    }
    if (Array.isArray(parsed.actionItems)) {
      parsed.actionItems = parsed.actionItems.filter(
        (s: unknown) => typeof s === "string" && s.trim()
      );
    }
    if (Array.isArray(parsed.resources)) {
      parsed.resources = parsed.resources.filter(
        (r: unknown) =>
          r && typeof r === "object" && typeof (r as { title?: unknown }).title === "string"
      );
    }
    return Response.json(parsed);
  } catch (err) {
    console.error("[api/summary] failed to parse model JSON:", err, "raw:", rawContent);
    return Response.json({ error: "Failed to parse the generated summary" }, { status: 502 });
  }
}
