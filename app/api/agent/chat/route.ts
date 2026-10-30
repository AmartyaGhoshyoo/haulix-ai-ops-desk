// POST /api/agent/chat — the agent backend plugs in here (see docs/ for the plan).
// Until it exists, the widget runs in demo mode in the browser and this answers 501.
// When ready: forward { conversationId, message } to the backend and return its Reply
// ({ text, cards?, quick? }), the same way Nofa's site forwards to ZOVAK.

export async function POST() {
  return Response.json(
    { text: "The agent backend isn't connected yet — this site is running in demo mode." },
    { status: 501 }
  );
}
