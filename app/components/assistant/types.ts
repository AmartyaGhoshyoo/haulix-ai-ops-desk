// What the agent can show besides text. The real backend will return the same shapes.

export interface Step {
  label: string;
  done: boolean;
  when?: string;
}

export type Card =
  | { kind: "shipment"; id: string; from: string; to: string; status: string; eta: string; steps: Step[]; risk?: string }
  | { kind: "quote"; lane: string; options: { name: string; price: string; days: string; co2: string; best?: boolean }[] }
  | { kind: "products"; items: { id: string; name: string; price: string; note: string; icon: string; tone: string }[] }
  | { kind: "compare"; rows: { label: string; a: string; b: string }[]; a: string; b: string }
  | { kind: "cart"; lines: { name: string; qty: number; price: string }[]; total: string }
  // Anything that changes the real world waits for a human tap (as in Nofa).
  | { kind: "proposal"; title: string; detail: string; confirm: string; done: string };

export interface Reply {
  text: string;
  cards?: Card[];
  quick?: string[];
}

export interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  cards?: Card[];
  quick?: string[];
}

/** Each site's demo brain: plain keyword rules until the real agent backend is connected. */
export interface Brain {
  name: string; // what the agent calls itself
  greeting: Reply;
  reply: (text: string, history: Message[]) => Reply;
  voiceHint: string;
}
