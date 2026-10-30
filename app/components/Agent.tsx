"use client";

// The brain holds functions, so the assistant is mounted from a client component.
import Assistant from "./assistant/Assistant";
import { BRAIN } from "../data/brain";

export default function Agent() {
  return <Assistant brain={BRAIN} />;
}
