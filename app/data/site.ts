// Haulix: an AI operations desk for logistics. All copy and demo data in one place.

export const SITE = {
  name: "Haulix",
  tagline: "The AI operations desk for logistics",
  by: { name: "Zovak", url: "https://www.zovak.tech" },
  email: "hello@zovak.tech",
};

// One shipment's journey, told as six chapters. Each chapter = one agent at work.
export const CHAPTERS = [
  {
    agent: "Intake agent",
    title: "Orders arrive *any way* customers send them.",
    body: "Emails, WhatsApp messages, PDFs and phone calls become clean bookings: addresses checked, weights and dims parsed, missing details asked for — no retyping.",
    stat: "≈ 40 s",
    statLabel: "from email to booking draft",
  },
  {
    agent: "Quoting agent",
    title: "Three carriers priced *before the coffee cools.*",
    body: "Live rates across contracted carriers, compared on price, transit time and CO₂. The best option is proposed; a person approves anything above the spend limit.",
    stat: "3 options",
    statLabel: "price · speed · carbon",
  },
  {
    agent: "Route planner",
    title: "Routes that *rebuild themselves.*",
    body: "Multi-stop routes with time windows, vehicle capacity and driver hours. When an order is added at 2 pm, the plan for every truck updates in seconds.",
    stat: "−18%",
    statLabel: "kilometres per drop (target)",
  },
  {
    agent: "Warehouse agent",
    title: "Pick, pack and slot — *in the right order.*",
    body: "Waves are planned around truck departures, fast movers are slotted near the dock, and low stock triggers a replenishment proposal.",
    stat: "1 tap",
    statLabel: "to approve a reorder",
  },
  {
    agent: "Exception agent",
    title: "When the storm hits, *it already has a plan.*",
    body: "Weather, port congestion or a breakdown flags at-risk shipments early. The agent prepares a reroute or rebooking with the cost and new ETA — and waits for your OK.",
    stat: "9 h",
    statLabel: "saved on the demo reroute",
  },
  {
    agent: "Billing & claims agent",
    title: "Proof, invoice, *done.*",
    body: "Proof of delivery is matched to the order, invoices are drafted and checked against the quote, and damage claims are assembled with photos and timelines.",
    stat: "0",
    statLabel: "invoices sent without a match",
  },
];

export const AGENTS = [
  { name: "Intake", today: "Read 214 emails and 61 WhatsApps → 148 booking drafts, 9 asked for missing details", does: "Turns emails, chats, PDFs and calls into bookings", icon: "inbox" },
  { name: "Quoting", today: "Priced 87 lanes across 6 carriers; 31 auto-booked under the $500 limit", does: "Prices lanes across carriers; proposes the best", icon: "receipt" },
  { name: "Route planner", today: "Re-planned 36 trucks 4 times today; −412 km in total", does: "Builds and re-plans multi-stop routes live", icon: "route" },
  { name: "Dispatcher", today: "Assigned 52 loads; every driver within legal hours", does: "Assigns drivers and trucks, sends job sheets", icon: "truck" },
  { name: "Warehouse", today: "Planned 6 pick waves around truck departures; 2 reorders waiting for OK", does: "Plans waves, slotting and replenishment", icon: "boxes" },
  { name: "Exception", today: "Flagged 7 at-risk shipments before customers noticed; 3 reroutes proposed", does: "Spots risk early, prepares reroutes and rebookings", icon: "alert" },
  { name: "Customer comms", today: "Answered 1,906 'where is my parcel?' — 81% without a person", does: "Answers 'where is my parcel' on chat, voice, WhatsApp", icon: "message" },
  { name: "Customs & docs", today: "Drafted 44 invoice + packing-list sets; caught 3 HS-code mismatches", does: "Drafts invoices, packing lists, HS codes for review", icon: "file" },
  { name: "Billing & claims", today: "Matched 129 PODs, drafted 129 invoices, assembled 2 claim packs", does: "Matches POD, drafts invoices, assembles claims", icon: "wallet" },
];

export const SHIPMENTS = [
  { id: "HX-2041", lane: "Chittagong → Rotterdam", mode: "Ocean", status: "Rerouted", eta: "Nov 18", risk: "low" },
  { id: "HX-2057", lane: "Dhaka → Kolkata", mode: "Road", status: "In transit", eta: "Today 18:40", risk: "low" },
  { id: "HX-2063", lane: "Shenzhen → Dhaka", mode: "Air", status: "Customs hold", eta: "Nov 2", risk: "high" },
  { id: "HX-2070", lane: "Mumbai → Dubai", mode: "Ocean", status: "Booked", eta: "Nov 9", risk: "medium" },
  { id: "HX-2078", lane: "Sylhet → Dhaka", mode: "Road", status: "Out for delivery", eta: "Today 16:10", risk: "low" },
];

export const FEED = [
  "Intake parsed an email from Rahman Textiles → booking HX-2081 drafted",
  "Quoting priced Dhaka → Singapore: 3 carriers, best $1,840 (Air, 2 days)",
  "Exception flagged HX-2063: customs hold — HS code mismatch, fix proposed",
  "Route planner re-optimised 14 stops after a 2 pm order — saved 23 km",
  "Customer comms answered 'where is my parcel?' for HX-2057 on WhatsApp",
  "Warehouse proposed reorder: 400 cartons (A-14) — waiting for approval",
  "Billing matched POD for HX-2032 → invoice INV-7781 drafted",
  "Exception rerouted HX-2041 via Colombo — new ETA Nov 18, needs OK",
];

// Human-in-the-loop: what the agents may do alone vs. what needs a person.
export const GUARDRAILS = [
  { rule: "Agents propose, people approve", detail: "Bookings, reroutes, reorders and invoices are drafted by agents and confirmed by a person — like Nofa's confirm-before-booking rule." },
  { rule: "Spend limits", detail: "Below a set amount (e.g. $500) a quote can auto-book; above it, a manager approves." },
  { rule: "Every action is logged", detail: "Who asked, which agent acted, what data it used, and who approved — searchable for audits." },
  { rule: "Customers see the truth", detail: "ETAs and statuses come from carrier and GPS events, never guessed by the model." },
];

export const CHANNELS = ["Website chat", "Voice & phone", "WhatsApp", "Email inbox", "EDI / API", "Driver app"];
