# Haulix — the AI operations desk for logistics

A marketing + demo site for an agentic logistics product by Zovak. Nine AI agents take orders,
quote lanes, plan routes, watch shipments and fix problems — and ask a person before anything costly.

- **HD planet behind the page** (`app/components/Planet.tsx`): 8K day/night Earth maps (Solar System Scope,
  CC BY 4.0, from NASA data), ocean mask for sun glint and flowing water, two drifting cloud shells, an
  atmosphere, stars, and the Haulix network — pulsing hubs at real ports and glowing lanes (red = open
  exception). Bloom + a soft corner nebula. It rises huge behind the hero, then zooms out and swings
  left → right → centre as you scroll. Phones get 4K maps.
- **The agent workstation** (`app/components/Workstation.tsx`), the heart of the page: a live desk where
  emails/WhatsApps/PDFs/calls become bookings, a route planner where a 2 pm order re-plans the run, an
  exception queue with Approve / Decline (cost + ETA per proposal), and an ops board
- Glass sections: the nine agents, network numbers, guardrails, closing CTA
- **Ops desk** with Shipments / Quotes / Inbox tabs, and the guardrails
- **Chat + voice assistant** (Zovak web widget) in demo mode with sample data
- Palette "radar": midnight #0A0D1A, electric blue #2F6BFF, signal red #FF3B5C; Fira Sans + Fira Code

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Where the 3D comes from (all free)

See `public/3d/CREDITS.md`. To swap a place's photo: put a new aerial photo in `public/3d/photo/`,
make its depth map (`python depth.py photo.jpg photo_depth.png`, Depth-Anything V2 Small, ONNX), and
point `createRelief(...)` in `world/highway.ts` or `world/port.ts` at the two files.

## Connecting the backend later

The widget calls `POST /api/agent/chat` (see `app/api/agent/chat/route.ts`, currently 501).
Set `NEXT_PUBLIC_AGENT_LIVE=true` and proxy that route to the Haulix backend. The reply shape
(`text`, `cards`, `quick`) is in `app/components/assistant/types.ts`.

## Plan

`docs/Haulix_Agentic_Plan.pdf` — what can be automated, agents and tools, guardrails, data model,
API, integrations, reuse of ZOVAK, roadmap and open decisions. Rebuild with `python3 docs/build_plan.py`.
