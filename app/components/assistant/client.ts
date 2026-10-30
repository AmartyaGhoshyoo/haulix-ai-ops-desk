// The only place the widget talks to an agent. Demo mode (default) answers in the browser
// with the site's brain; set NEXT_PUBLIC_AGENT_LIVE=true once the backend exists and
// /api/agent/chat forwards to it (same Reply shape as types.ts).
import type { Brain, Message, Reply } from "./types";

export const AGENT_LIVE = process.env.NEXT_PUBLIC_AGENT_LIVE === "true";

export async function ask(brain: Brain, text: string, history: Message[], conversationId: string): Promise<Reply> {
  if (!AGENT_LIVE) {
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 500)); // feels like thinking
    return brain.reply(text, history);
  }
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message: text }),
  });
  const data = (await res.json().catch(() => null)) as Reply | null;
  return data?.text ? data : { text: "The agent backend isn't reachable right now. Please try again in a moment." };
}
