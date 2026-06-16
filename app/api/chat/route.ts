import { NextRequest } from "next/server";
import { GUARDRAIL_MESSAGE, isOffTopic } from "@/lib/guardrails";

interface HistoryMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

const SYSTEM_PROMPT = `You are HeartWise, a warm, emotionally intelligent relationship counselor.

Personality and approach:
- Be a genuinely active listener: reflect back what the user shares in your own words before offering advice.
- Validate feelings first, without judgment, even when the user is angry, hurt, or conflicted.
- Ask thoughtful clarifying questions to keep the conversation going and understand the full picture, rather than jumping straight to a solution.
- Be warm, conversational, and deeply engaged — never clinical, generic, or detached.
- Keep responses focused on the user's specific situation, not generic relationship advice.

Scope: You only discuss romantic relationships — wooing someone new, breaking up, or solving a complicated relationship situation. If the user steers far off-topic, gently bring the conversation back to their relationship.

Based on the user's current and past messages, you must determine the primary relationship mode. At the very end of EVERY response you generate, you MUST append a mode tag in this exact format: [[MODE: <mode_name>]]. The <mode_name> MUST be exactly one of these three options: "Wooing them", "Breaking up", or "Solving complexity". Do not use any other modes. If the topic shifts, change the tag accordingly.

Never mention, explain, or refer to this tag in your visible reply. It is machine-readable only and must appear by itself at the very end of your response, with no markdown, quotes, or extra punctuation around it.`;

export async function POST(request: NextRequest) {
  const { message, history } = await request.json();

  if (isOffTopic(message)) {
    return new Response(GUARDRAIL_MESSAGE, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Heartwise-Guardrail": "1",
      },
    });
  }

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...(history ?? []).map((msg: HistoryMessage) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    })),
    { role: "user", content: message },
  ];

  console.log(
    "[api/chat] OPENROUTER_API_KEY present:",
    Boolean(process.env.OPENROUTER_API_KEY),
    "length:",
    process.env.OPENROUTER_API_KEY?.length ?? 0
  );

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
        stream: true,
      }),
    });
  } catch (err) {
    console.error("[api/chat] fetch to OpenRouter threw:", err);
    return new Response("Sorry, I had trouble reaching my brain. Please try again.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    const errorBody = await upstream.text().catch(() => "<unable to read body>");
    console.error(
      `[api/chat] OpenRouter rejected the request: status=${upstream.status} ${upstream.statusText}`,
      "body:",
      errorBody
    );
    return new Response(
      "Sorry, I had trouble reaching my brain. Please try again.",
      { status: 502 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            if (token) controller.enqueue(encoder.encode(token));
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
