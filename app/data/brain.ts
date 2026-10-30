// Demo brain for the Haulix assistant: keyword rules with realistic answers and cards.
// Replaced by the real agent backend later (same Reply shape).
import type { Brain } from "../components/assistant/types";

const track = (id: string) => ({
  text: `Here's ${id}. It's moving on schedule — I'll message you if anything changes.`,
  cards: [
    {
      kind: "shipment" as const,
      id,
      from: "Dhaka hub",
      to: "Kolkata DC",
      status: "In transit",
      eta: "Today 18:40",
      steps: [
        { label: "Booked", done: true, when: "Oct 29 09:12" },
        { label: "Picked up", done: true, when: "Oct 30 07:40" },
        { label: "Border cleared (Benapole)", done: true, when: "Oct 30 13:05" },
        { label: "Out for delivery", done: false },
        { label: "Delivered", done: false },
      ],
    },
  ],
  quick: ["Any delays on my shipments?", "Get me a quote", "Book a pickup"],
});

export const BRAIN: Brain = {
  name: "Haulix",
  voiceHint: "Try: “Where is shipment HX-2057?”, “Any delays today?” or “Quote Dhaka to Singapore, 300 kilos”.",
  greeting: {
    text: "Hi, I'm Haulix — your logistics operations agent. I can track shipments, spot delays and fix them, quote lanes and book pickups. What do you need?",
    quick: ["Track HX-2057", "Any delays on my shipments?", "Quote Dhaka → Singapore"],
  },
  reply: (raw) => {
    const t = raw.toLowerCase();
    const id = raw.match(/hx-?\d{3,5}/i)?.[0]?.toUpperCase().replace(/^HX-?/, "HX-");
    if (/(reroute|approve|yes,? reroute)/.test(t))
      return {
        text: "Prepared. Approve it and I'll rebook with the carrier and update the customer automatically.",
        cards: [
          {
            kind: "proposal",
            title: "Reroute HX-2041 via Colombo",
            detail: "Avoids Singapore congestion. +$120, new ETA Nov 18 (9 hours earlier than waiting).",
            confirm: "Approve reroute",
            done: "Rebooked with the carrier; customer notified on WhatsApp and email.",
          },
        ],
      };
    if (/(delay|late|risk|problem|issue|stuck)/.test(t))
      return {
        text: "Two shipments need attention. HX-2063 is on a customs hold (HS code mismatch — I've drafted the corrected invoice). HX-2041 faces port congestion; rerouting via Colombo saves about 9 hours.",
        cards: [
          {
            kind: "shipment",
            id: "HX-2041",
            from: "Chittagong",
            to: "Rotterdam",
            status: "At risk",
            eta: "Nov 18 (was Nov 19)",
            risk: "Port congestion at Singapore — reroute ready",
            steps: [
              { label: "Loaded", done: true, when: "Oct 24" },
              { label: "Transshipment", done: false },
              { label: "Arrival", done: false },
            ],
          },
        ],
        quick: ["Reroute HX-2041", "Fix the customs hold", "Track HX-2057"],
      };
    if (/(customs|hs code|invoice fix|hold)/.test(t))
      return {
        text: "The hold on HX-2063 is an HS code mismatch on the commercial invoice. I've drafted the corrected one for your review before it goes to the broker.",
        cards: [{ kind: "proposal", title: "Send corrected invoice for HX-2063", detail: "HS 8517.62 → 8517.71 on line 3; broker: Swift Customs.", confirm: "Approve & send", done: "Sent to the broker; customs re-check requested." }],
      };
    if (/(quote|price|rate|cost|how much)/.test(t))
      return {
        text: "Here are three options for Dhaka → Singapore, 300 kg. Air is fastest; sea-air balances cost and carbon.",
        cards: [
          {
            kind: "quote",
            lane: "Dhaka → Singapore · 300 kg",
            options: [
              { name: "Air express", price: "$1,840", days: "2 days", co2: "1.9 t CO₂", best: true },
              { name: "Sea-air", price: "$1,120", days: "6 days", co2: "0.7 t CO₂" },
              { name: "Ocean LCL", price: "$640", days: "14 days", co2: "0.2 t CO₂" },
            ],
          },
        ],
        quick: ["Book air express", "Book a pickup"],
      };
    if (/(book|pickup|pick up|collect)/.test(t))
      return {
        text: "I can book that. Here's the pickup I've prepared — nothing is booked until you confirm.",
        cards: [{ kind: "proposal", title: "Pickup · tomorrow 10:00–12:00", detail: "Rahman Textiles, Tejgaon, Dhaka · 12 cartons · 300 kg · driver assigned on confirm.", confirm: "Confirm pickup", done: "Booked: driver Karim (truck DH-4471). Label and job sheet sent." }],
      };
    if (/(stock|warehouse|inventory|reorder)/.test(t))
      return {
        text: "Bay A-14 is at 18% — it will run out in about 3 days at the current pick rate. I've prepared a reorder.",
        cards: [{ kind: "proposal", title: "Reorder 400 cartons (A-14)", detail: "Supplier: Meghna Packaging · arrives Nov 4 · $860.", confirm: "Approve reorder", done: "Purchase order PO-3310 sent to Meghna Packaging." }],
      };
    if (id || /(track|where|status|parcel|shipment)/.test(t)) return track(id ?? "HX-2057");
    if (/(hello|hi|hey|good)/.test(t)) return BRAIN.greeting;
    return {
      text: "In this demo I can track shipments, flag delays and prepare reroutes, quote lanes, book pickups and check warehouse stock. Which would help?",
      quick: ["Track HX-2057", "Any delays on my shipments?", "Check warehouse stock"],
    };
  },
};
