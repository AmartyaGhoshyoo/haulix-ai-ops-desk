# Haulix — the AI operations desk for logistics

A marketing + demo site for an agentic logistics product by Zovak. Nine AI agents take orders,
quote lanes, plan routes, watch shipments and fix problems — and ask a person before anything costly.

- **3D globe** (three.js) with real hubs and live shipment arcs
- **Pinned scroll story:** one shipment, six agents (intake → quote → route → warehouse → exception → billing)
- **Live ops desk mock:** shipments table, KPI counters, streaming agent log
- **Chat + voice assistant** (Zovak web widget) in demo mode with sample data

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
