"""Builds docs/Haulix_Agentic_Plan.html (print to PDF with headless Chrome).

Run:  python3 docs/build_plan.py
"""
import pathlib
from plandoc import bullets, callout, para, pre, render, table

META = {
    "kicker": "Zovak · Product plan",
    "title": "Haulix — the AI operations desk for logistics",
    "subtitle": "What can be automated in a logistics workload, how the agents work, what stays with people, and how we build the backend on what we learned from Nofa / ZOVAK.",
    "by": "Prepared for Amartya Ghosh · Zovak",
    "date": "30 Oct 2026",
    "status": "Frontend demo built · backend not started",
}
THEME = {
    "cover_bg": "linear-gradient(150deg,#111317 0%,#1c2027 70%,#2a2a1c 100%)",
    "cover_ink": "#f5f5f0",
    "accent_on_cover": "#ffd23f",
    "accent": "#d9a400",
    "accent_dark": "#6b5200",
    "th_bg": "#111317",
    "th_ink": "#ffd23f",
    "callout_bg": "#fff8dc",
}

S = []

S.append(("Summary", para(
    "Haulix is an AI operations desk for freight forwarders, 3PLs, courier and trucking companies. Nine specialist agents take orders in any format, quote lanes, plan routes, dispatch drivers, run the warehouse, watch every shipment, fix problems, prepare customs documents and close out billing.",
    "The rule is the same one that makes Nofa safe: **the AI does the legwork, a person approves anything that spends money or makes a promise.** Below a spend limit some actions can run on their own; everything is logged.",
    "This document lists every task we can automate, which agent owns it, what tools it needs, the guardrails, the data model, the API the website already expects, and a phased plan. Please review it — section 13 lists the decisions I need from you before backend work starts.",
) + callout("Status: the website (haulix-logistics) is built with a working chat + voice widget in demo mode. The widget calls POST /api/agent/chat, which returns 501 until the backend exists. Nothing in this document is built on the server yet.")))

S.append(("Who uses it", table(
    ["Person", "Their day today", "What Haulix takes off their plate"],
    [
        ["Ops / dispatch coordinator", "Retypes emails into the TMS, phones carriers, juggles driver WhatsApps", "Order intake, carrier quotes, dispatch, status chasing"],
        ["Customer service", "\"Where is my parcel?\" calls and emails all day", "Tracking answers on chat, voice, WhatsApp, email — with real ETAs"],
        ["Warehouse lead", "Spreadsheets for slots, waves and reorders", "Wave plans, slotting, low-stock reorders for approval"],
        ["Customs / docs clerk", "Builds invoices, packing lists, HS codes by hand", "Drafts every document for review, flags mismatches"],
        ["Finance", "Matches PODs to invoices, chases disputes", "POD matching, invoice drafts, claim packs"],
        ["Shipper (the customer)", "Waits on hold for quotes and updates", "Self-serve quotes, bookings, tracking, claims — 24/7"],
        ["Driver", "Paper job sheets, calls the office for changes", "Job sheets and route changes pushed to WhatsApp / driver app"],
    ],
)))

S.append(("What can be automated", para(
    "Autonomy levels: **Auto** = agent acts alone (read-only or low-risk); **Propose** = agent prepares, a person taps approve; **Auto ≤ limit** = auto below a configured spend limit, otherwise Propose; **Human** = agent only assists.",
) + "<h3>Order to cash</h3>" + table(
    ["Task", "What the agent does", "Agent", "Autonomy"],
    [
        ["Order intake", "Reads emails, PDFs, WhatsApp, calls and web forms; extracts shipper, consignee, cargo, dims, dates; asks for what's missing", "Intake", "Auto (draft)"],
        ["Address & data validation", "Geocodes addresses, checks postcodes, flags dangerous goods keywords, dedupes customers", "Intake", "Auto"],
        ["Quoting", "Prices the lane across contracted carriers and rate cards; compares price, transit time, CO₂", "Quoting", "Auto"],
        ["Booking with carrier", "Books the chosen option through carrier API / portal / email", "Quoting", "Auto ≤ limit"],
        ["Pickup scheduling", "Offers pickup windows, books them, sends labels and job sheet", "Dispatcher", "Propose"],
        ["Route planning", "Multi-stop routes with time windows, capacity, driver hours; re-plans when orders change", "Route planner", "Auto (plan), Propose (publish changes after dispatch)"],
        ["Driver assignment", "Matches loads to drivers/trucks by location, hours, licence, vehicle", "Dispatcher", "Propose"],
        ["Proof of delivery", "Collects signature, photo, GPS; checks counts", "Billing & claims", "Auto"],
        ["Invoicing", "Drafts invoices from quote + POD + accessorials; checks against the quote", "Billing & claims", "Propose"],
        ["Payment chasing", "Polite reminders on schedule, answers invoice questions", "Billing & claims", "Auto"],
    ],
) + "<h3>Visibility and exceptions</h3>" + table(
    ["Task", "What the agent does", "Agent", "Autonomy"],
    [
        ["Tracking aggregation", "Pulls carrier events, AIS (ocean), flight status, GPS; one timeline per shipment", "Exception", "Auto"],
        ["Predictive ETA", "Estimates arrival from live events, port congestion, weather, history", "Exception", "Auto"],
        ["Risk detection", "Flags at-risk shipments early (delay, missed connection, customs hold, temperature)", "Exception", "Auto"],
        ["Reroute / rebook", "Prepares alternative routes or carriers with cost and new ETA", "Exception", "Propose"],
        ["Proactive customer updates", "Tells the customer before they ask, on their preferred channel", "Customer comms", "Auto (templated), Propose (bad news over a threshold)"],
        ["\"Where is my parcel?\"", "Answers on web chat, voice, phone, WhatsApp, email using the live timeline", "Customer comms", "Auto"],
        ["Escalation", "Hands hard cases to a person with a summary and suggested reply", "Customer comms", "Auto"],
    ],
) + "<h3>Warehouse</h3>" + table(
    ["Task", "What the agent does", "Agent", "Autonomy"],
    [
        ["Inbound / ASN check", "Matches arrivals to ASNs and POs, flags shortages and damage", "Warehouse", "Auto"],
        ["Slotting", "Moves fast movers near the dock, groups items picked together", "Warehouse", "Propose"],
        ["Wave / pick planning", "Builds pick waves around truck departure times", "Warehouse", "Auto"],
        ["Replenishment", "Forecasts stock-outs, drafts purchase orders", "Warehouse", "Propose"],
        ["Cycle counts", "Schedules counts where variance is likely", "Warehouse", "Auto"],
    ],
) + "<h3>Documents and compliance</h3>" + table(
    ["Task", "What the agent does", "Agent", "Autonomy"],
    [
        ["Commercial invoice / packing list", "Drafts from order data, checks totals and weights", "Customs & docs", "Propose"],
        ["HS code suggestion", "Suggests codes with reasoning and confidence; never final without a person", "Customs & docs", "Human (assist)"],
        ["Bill of lading / AWB / CMR", "Pre-fills from booking", "Customs & docs", "Propose"],
        ["Document mismatch check", "Compares invoice vs packing list vs booking", "Customs & docs", "Auto"],
        ["Claims", "Assembles photos, timeline, POD, carrier liability; drafts the claim letter", "Billing & claims", "Propose"],
    ],
)))

S.append(("The agents", para(
    "One **orchestrator** talks to the person (customer or staff) and routes work to specialist agents. Each specialist owns a small set of tools, so its prompt stays short and its actions are easy to audit. All agents read and write one shared Shipment record — nobody retypes anything.",
) + table(
    ["Agent", "Owns", "Main tools (functions)"],
    [
        ["Orchestrator", "Conversation, identity, routing, hand-offs", "identify_customer, route_to_agent, escalate_to_human"],
        ["Intake", "Turning messages into draft orders", "parse_document, extract_order, validate_address, request_missing_info, create_order_draft"],
        ["Quoting", "Rates and carrier bookings", "get_rates(lane, cargo), compare_options, create_quote, book_carrier (gated)"],
        ["Route planner", "Routes and re-plans", "optimise_routes(stops, fleet, windows), insert_stop, publish_plan (gated)"],
        ["Dispatcher", "Drivers, trucks, job sheets", "list_available_drivers, assign_load (gated), send_job_sheet"],
        ["Warehouse", "Waves, slots, stock", "get_inventory, forecast_stockout, plan_wave, propose_reorder (gated)"],
        ["Exception", "Risk and recovery", "get_tracking_events, predict_eta, assess_risk, propose_reroute (gated)"],
        ["Customer comms", "Updates and answers", "get_shipment_timeline, send_update(channel), draft_reply"],
        ["Customs & docs", "Paperwork", "draft_commercial_invoice, suggest_hs_code, check_document_set"],
        ["Billing & claims", "Money in, claims out", "match_pod, draft_invoice (gated send), build_claim_pack"],
    ],
) + "<h3>How a reroute flows (example)</h3>" + pre(
"""carrier event: vessel delayed at Singapore (+14 h)
  -> Exception agent: assess_risk(HX-2041) = high, ETA misses customer deadline
  -> propose_reroute(): options via Colombo (+$120, -9 h) / wait (+$0, +14 h)
  -> Proposal P-311 saved: status=pending, expires in 4 h, needs role=ops_manager
  -> ops manager taps Approve in the ops desk (or replies YES on WhatsApp)
  -> server re-checks: proposal fresh? price unchanged? capacity still there?
  -> book_carrier() with idempotency key -> carrier confirms -> status=confirmed
  -> Customer comms: send_update(customer, WhatsApp+email, new ETA Nov 18)
  -> Audit log: who asked, which agent, data used, who approved, carrier reference""")))

S.append(("Guardrails — what stays with people", bullets([
    "**Agents propose, people approve.** Bookings above the limit, reroutes, publishing new routes after dispatch, reorders, invoices and claims are proposals with an expiry. The server re-checks before acting (same pattern as Nofa's confirm-before-booking).",
    "**Spend limits per company and per role** (e.g. auto-book under $500; manager over $2,000).",
    "**Facts come from systems, not the model.** ETAs, prices, stock and statuses come from carrier/GPS/WMS data. The model explains; it never invents a number. Plain code checks every figure in a proposal against the source.",
    "**Customs decisions are human.** HS codes and declarations are suggestions with confidence; a licensed person signs off.",
    "**Every action is logged:** request, agent, tool calls, inputs, outputs, approver, external reference. Searchable and exportable for audits.",
    "**Idempotency and retries:** every external call carries an idempotency key; webhook retries are de-duplicated.",
    "**Tenant isolation:** each logistics company's data, carriers and rules are separate; a customer can only see their own shipments after verification (shipment ID + email/phone OTP).",
    "**Kill switch:** an operator can pause any agent or all automation instantly; work falls back to the human queue.",
])))

S.append(("Channels", table(
    ["Channel", "Who", "How (reusing ZOVAK)"],
    [
        ["Website chat + voice", "Shippers, prospects", "The Zovak web widget already on the site; text via /api/agent/chat, voice via the GPT-Live browser flow used in Nofa"],
        ["Phone", "Shippers, drivers", "Telnyx number → OpenAI SIP → same agent tools (the working Nofa phone setup)"],
        ["WhatsApp", "Shippers, drivers", "Meta WhatsApp Cloud API adapter from Nofa; templates for proactive updates"],
        ["Email inbox", "Shippers, carriers", "Shared inbox (Gmail/Outlook) read by Intake; replies drafted or sent"],
        ["EDI / API", "Large shippers, carriers", "EDI 204/214/210 or JSON webhooks for orders and status"],
        ["Driver app / WhatsApp", "Drivers", "Job sheets, route changes, POD capture"],
        ["Ops desk (staff portal)", "Ops team", "Live console like the website's demo: shipments, agent log, approvals queue"],
        ["SMS", "Consignees", "Delivery windows; Alpha SMS for Bangladesh as planned for Nofa"],
    ],
)))

S.append(("Data model (first version)", table(
    ["Entity", "Key fields"],
    [
        ["Company (tenant)", "id, name, spend_limits, carriers[], rate_cards[], settings"],
        ["Customer / Shipper", "id, company_id, name, contacts, addresses, preferred_channel, credit_terms"],
        ["Order", "id, customer_id, source (email/whatsapp/api…), raw_message_ref, status (draft→confirmed), cargo[], pickup, delivery, deadlines"],
        ["Shipment", "id (HX-…), order_id, mode, carrier, legs[], status, eta, eta_confidence, risk_level, documents[]"],
        ["Leg", "shipment_id, from, to, carrier_ref, planned/actual times, vehicle/vessel/flight"],
        ["TrackingEvent", "shipment_id, source, code, location, time, raw"],
        ["Quote", "id, lane, cargo, options[{carrier, price, transit, co2}], chosen, valid_until"],
        ["Route / Stop", "route_id, vehicle_id, driver_id, stops[{order_id, window, eta, seq}], status"],
        ["Driver / Vehicle", "id, licence, hours_used, location, capacity, type"],
        ["InventoryItem / Bay", "sku, bay, qty, min, velocity, supplier"],
        ["Document", "shipment_id, type (CI, PL, BL, AWB, POD, claim), version, status, file_ref"],
        ["Proposal", "id, kind (reroute/booking/reorder/invoice…), payload, cost, needs_role, status, expires_at, approved_by"],
        ["AuditEvent", "time, actor (agent/person), action, inputs, outputs, proposal_id, external_ref"],
        ["Conversation / Message", "channel, customer_id, messages, summary (shared with ZOVAK schema)"],
    ],
)))

S.append(("API the website already expects", para(
    "The website widget is wired for this contract. Turning on NEXT_PUBLIC_AGENT_LIVE=true and pointing the Next.js route at the backend makes the site live without touching the UI.",
) + pre(
"""POST /api/agent/chat            (Next.js route -> proxies to the Haulix backend, like Nofa -> ZOVAK)
request:  { "message": "Any delays on my shipments?", "conversationId": "web-…",
            "history": [{ "role": "user"|"agent", "text": "…" }] }
response: { "text": "…", "quick": ["Reroute HX-2041", "…"],
            "cards": [ Card, … ] }

Card =
 | { kind: "shipment", id, from, to, status, eta, risk?, steps: [{label, done, when?}] }
 | { kind: "quote", lane, options: [{ name, price, days, co2, best? }] }
 | { kind: "proposal", title, detail, confirm, done }      // needs a human tap
""") + "<h3>Backend endpoints (proposed)</h3>" + table(
    ["Method & path", "Purpose"],
    [
        ["POST /v1/chat (stream)", "Conversation turn; streams text, then cards"],
        ["POST /v1/proposals/{id}/approve | /reject", "Human decision; server re-validates then executes"],
        ["GET /v1/shipments?status=&risk=", "Ops desk list"],
        ["GET /v1/shipments/{id}/timeline", "Events + ETA + risk"],
        ["POST /v1/orders/intake", "Email/WhatsApp/API message in → draft order"],
        ["POST /v1/quotes", "Price a lane"],
        ["POST /v1/routes/optimise", "Plan or re-plan routes"],
        ["POST /v1/webhooks/{carrier|telnyx|meta|email}", "Inbound events (signed, de-duplicated)"],
        ["GET /v1/audit?shipment=", "Audit trail"],
        ["POST /v1/voice/session", "Browser voice session (GPT-Live), same as Nofa"],
    ],
)))

S.append(("Integrations", table(
    ["Need", "Options (pick per customer)", "First choice for MVP"],
    [
        ["Carrier rates & booking", "Carrier APIs (DHL, FedEx, Maersk), aggregators (Freightos, project44 for visibility), rate-card spreadsheets", "Rate cards (CSV) + 1 carrier API"],
        ["Ocean/air tracking", "project44, Terminal49, AIS feeds, airline status", "One aggregator"],
        ["Maps & routing", "Google Routes / OSRM / OR-Tools for optimisation", "OR-Tools + OSRM (free, self-hosted)"],
        ["Weather & disruption", "OpenWeather, port congestion feeds", "OpenWeather"],
        ["WMS / ERP", "Existing WMS via API/CSV, or Haulix's own light inventory", "CSV import + own tables"],
        ["Documents", "OCR + LLM extraction (PDF, images)", "LLM vision extraction"],
        ["Messaging", "Telnyx (voice/SMS), Meta WhatsApp, Gmail/Outlook, Alpha SMS (BD)", "Reuse Nofa adapters"],
        ["Accounting", "Xero, QuickBooks, Tally", "Export first"],
    ],
)))

S.append(("What we reuse from Nofa / ZOVAK", table(
    ["ZOVAK piece", "Reused for Haulix as"],
    [
        ["Channel adapters (web chat, voice, phone SIP, WhatsApp, SMS, email)", "Same adapters, new tenant config"],
        ["Shared Python agent + tool-calling loop with streaming", "Orchestrator + specialist agents"],
        ["Read / Propose / Mutate tool policy, proposals with expiry", "Bookings, reroutes, reorders, invoices"],
        ["Plain-code checks after the model (no invented slots/prices)", "Price, ETA and stock checks before any card is shown"],
        ["Outbox worker + notifications", "Customer updates, driver job sheets, reminders"],
        ["Recovery workflow (staff absence → reschedule many bookings)", "Exception workflow (one delay → re-plan many shipments)"],
        ["Staff portal pattern", "Ops desk with approvals queue"],
        ["Audit schema, idempotency, webhook de-duplication", "Same, with carrier references"],
        ["Next.js proxy route + private demo gate", "Same for the Haulix site"],
    ],
) + callout("New pieces Haulix needs that Nofa doesn't have: a route optimiser, carrier/tracking connectors, document extraction and generation, inventory, and an ETA/risk model.")))

S.append(("Roadmap", table(
    ["Phase", "Scope", "Done when"],
    [
        ["0 · Demo site (done)", "Website, 3D globe, scroll story, ops console mock, chat + voice widget in demo mode", "Live on a URL you choose"],
        ["1 · Tracking + customer comms MVP", "Shipment/Event tables, CSV + 1 tracking aggregator, \"where is my parcel\" on web chat, voice and WhatsApp, ops desk read-only", "Real shipments answered end-to-end with real ETAs"],
        ["2 · Intake + quoting", "Email/WhatsApp intake to draft orders, rate cards, quote cards, booking proposals with spend limits", "An emailed request becomes an approved booking without retyping"],
        ["3 · Exceptions", "Risk scoring, reroute proposals, proactive updates, approvals queue, audit", "A delay triggers a proposal and customer update within minutes"],
        ["4 · Routes + dispatch", "OR-Tools routing, driver assignment, job sheets on WhatsApp, POD capture", "Daily routes planned and re-planned by the agent"],
        ["5 · Warehouse, docs, billing", "Waves, reorders, CI/PL drafts, HS suggestions, invoice + claim packs", "Order-to-cash closed with approvals"],
    ],
)))

S.append(("How we measure it", table(
    ["Metric", "Target for a pilot customer"],
    [
        ["Order intake time (message → booking draft)", "< 1 minute"],
        ["Quote turnaround", "< 2 minutes, 24/7"],
        ["\"Where is my parcel\" handled without a person", "≥ 70%"],
        ["At-risk shipments flagged before the customer notices", "≥ 80%"],
        ["Km per drop after route optimisation", "−10 to −18%"],
        ["Invoices sent with a POD/quote mismatch", "0"],
        ["Approvals answered within SLA", "≥ 95% within 30 min"],
    ],
)))

S.append(("Risks", table(
    ["Risk", "Mitigation"],
    [
        ["Carrier data is late or wrong", "Show source and time on every status; confidence on ETAs; human escalation"],
        ["Model invents a price/ETA", "Cards built from database values only; model text is checked against them"],
        ["Wrong customs code → fines", "HS codes are suggestions; licensed person signs off"],
        ["Too many approval taps", "Spend limits and per-action auto rules, tuned per customer"],
        ["Integration effort per customer", "Start with CSV/email + one aggregator; add APIs per pilot"],
        ["Privacy of shipper data", "Tenant isolation, verified identity, retention policy, encrypted secrets"],
    ],
)))

S.append(("Decisions I need from you", bullets([
    "**Target customer for the pilot:** freight forwarder, courier/last-mile, or 3PL warehouse? (Changes which phase comes first.)",
    "**Region first:** Bangladesh/India (Alpha SMS, local carriers) or international lanes?",
    "**Separate repo or inside ZOVAK?** My suggestion: a new haulix-backend repo that imports shared ZOVAK packages (channels, agent loop, proposals), so Nofa stays untouched.",
    "**Spend limits and roles** to start with (e.g. auto ≤ $500, manager ≥ $2,000).",
    "**Which tracking aggregator / carrier** to integrate first (cost vs coverage).",
    "**Domain and deploy:** e.g. haulix.zovak.tech on Vercel, like Nofa.",
])))


if __name__ == "__main__":
    out = pathlib.Path(__file__).with_name("Haulix_Agentic_Plan.html")
    out.write_text(render(META, S, THEME), encoding="utf-8")
    print("wrote", out)
