# Haulix — the AI operations desk for logistics

A marketing + demo site for an agentic logistics product by Zovak. Nine AI agents take orders,
quote lanes, plan routes, watch shipments and fix problems — and ask a person before anything costly.

- **True 3D camera flight through four real places** (`app/components/World.tsx` + `app/components/world/*`):
  the Earth from orbit (NASA day/night/cloud textures, live shipping lanes), a night motorway interchange
  and a container port (real Unsplash aerial photos raised into 3D with a Depth-Anything depth map, so
  flyovers and container stacks stand up and the camera flies over them), and a warehouse built from
  CC0 Poly Haven models (steel shelving, boxes, crates, crane, doors, lamps) lit by a real warehouse HDRI.
  Each section's `data-cam` picks a station; scrolling moves the camera from shot `a` to shot `b`, and
  changing place cuts through black like a film edit
- **Buttons drive the world:** "Drop in a 2 pm order" re-plans every route arc and robot, picking an agent
  lights its warehouse bay in red, "Approve detour" draws the blue reroute around the storm-blocked lane
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
