# Haulix — the AI operations desk for logistics

A marketing + demo site for an agentic logistics product by Zovak. Nine AI agents take orders,
quote lanes, plan routes, watch shipments and fix problems — and ask a person before anything costly.

- **One 3D world, one camera flight:** as you scroll, the camera flies from a dotted globe in orbit down
  to a night city (trucks leave red/blue light trails), the port with a 9-container agent tower,
  a storm over the highway, and a top-down map (`app/components/World.tsx`, three.js, all drawn in code)
- **Real footage** (Mixkit free licence) for the fleet, port, storm and map stops, cross-faded over the
  3D world with a live HUD on top (route lines, agent target box, blocked road + detour, radar sweep)
- **Buttons drive the world:** "Drop in a 2 pm order" re-plans every truck, picking an agent lifts its
  container, "Approve detour" draws the reroute around the storm
- **Ops desk** with Shipments / Quotes / Inbox tabs, and the guardrails
- **Chat + voice assistant** (Zovak web widget) in demo mode with sample data
- Palette "radar": midnight #0A0D1A, electric blue #2F6BFF, signal red #FF3B5C; Fira Sans + Fira Code

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Connecting the backend later

The widget calls `POST /api/agent/chat` (see `app/api/agent/chat/route.ts`, currently 501).
Set `NEXT_PUBLIC_AGENT_LIVE=true` and proxy that route to the Haulix backend. The reply shape
(`text`, `cards`, `quick`) is in `app/components/assistant/types.ts`.

## Plan

`docs/Haulix_Agentic_Plan.pdf` — what can be automated, agents and tools, guardrails, data model,
API, integrations, reuse of ZOVAK, roadmap and open decisions. Rebuild with `python3 docs/build_plan.py`.
