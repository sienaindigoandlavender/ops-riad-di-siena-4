"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PasswordGate from "@/components/PasswordGate";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ──────────────────────────────────────────────────
interface GuestBooking {
  booking_id: string;
  first_name: string;
  last_name: string;
  guest_name: string;
  email: string;
  phone: string;
  country: string;
  property: string;
  room: string;
  check_in: string;
  check_out: string;
  nights: number | null;
  guests: number | null;
  adults: number | null;
  children: number | null;
  total_eur: number | null;
  city_tax: number | null;
  source: string;
  special_requests: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// ─── Constants ──────────────────────────────────────────────
const CITY_TAX = 2.5;
const RIAD_ROOMS = ["Hidden Gem", "Jewel Box", "Trésor Caché"];
const DOUARIA_ROOMS = ["Bliss", "Joy", "Love"];

// ─── Helpers ────────────────────────────────────────────────
function genInvNo(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `INV-${y}${m}${day}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function nights(a: string, b: string): number {
  if (!a || !b) return 0;
  const diff = Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function eur(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
}

// ─── Shared styles ──────────────────────────────────────────
const inp = "w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-black/10 focus:border-black/35 focus:outline-none transition-colors placeholder:text-black/18";
const sel = "w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-black/10 focus:border-black/35 focus:outline-none transition-colors appearance-none";

function Label({ children }: { children: string }) {
  return <label className="block text-[9.5px] font-medium tracking-[0.16em] uppercase text-black/30 mb-1">{children}</label>;
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════
function InvoicePage() {
  const [guests, setGuests] = useState<GuestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [showDD, setShowDD] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"pick" | "form" | "preview">("pick");

  // Fields
  const [invNo, setInvNo] = useState(genInvNo());
  const [invDate, setInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookRef, setBookRef] = useState("");
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [prop, setProp] = useState("The Riad");
  const [room, setRoom] = useState("");
  const [cin, setCin] = useState("");
  const [cout, setCout] = useState("");
  const [gCount, setGCount] = useState(2);
  const [rate, setRate] = useState<number>(0);
  const [inclTax, setInclTax] = useState(true);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [dType, setDType] = useState<"none"|"percent"|"fixed">("none");
  const [dVal, setDVal] = useState("");
  const [payMethod, setPayMethod] = useState("PayPal");
  const [payStatus, setPayStatus] = useState("Paid");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/invoice/guests").then(r => r.json()).then(d => { setGuests(d.guests || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function h(e: MouseEvent) { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setShowDD(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Calcs
  const n = nights(cin, cout);
  const roomTot = n * rate;
  const tax = inclTax ? CITY_TAX * gCount * n : 0;
  const extrasTot = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const sub = roomTot + tax + extrasTot;
  let disc = 0;
  if (dType === "percent") disc = sub * ((parseFloat(dVal) || 0) / 100);
  else if (dType === "fixed") disc = parseFloat(dVal) || 0;
  const total = Math.max(0, sub - disc);

  const fillBooking = useCallback((g: GuestBooking) => {
    setBookRef(g.booking_id); setFName(g.first_name); setLName(g.last_name);
    setEmail(g.email); setCountry(g.country);
    setProp(g.property || "The Riad"); setRoom(g.room);
    setCin(g.check_in ? g.check_in.split("T")[0] : "");
    setCout(g.check_out ? g.check_out.split("T")[0] : "");
    setGCount(g.guests || g.adults || 2);
    if (g.total_eur && g.nights && g.nights > 0) {
      const t = CITY_TAX * (g.guests || 2) * g.nights;
      const r = Math.round((g.total_eur - t) / g.nights);
      setRate(r > 0 ? r : 0);
    }
    setPayMethod(g.source?.toLowerCase().includes("airbnb") ? "Airbnb" : g.source?.toLowerCase().includes("booking") ? "Booking.com" : "PayPal");
    setSearchQ(""); setShowDD(false); setMode("form");
  }, []);

  const filtered = guests.filter(g => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return g.guest_name.toLowerCase().includes(q) || g.booking_id.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  }).slice(0, 12);

  function addLine(desc = "", price = 0) {
    setLines(p => [...p, { id: Date.now().toString() + Math.random().toString(36).slice(2, 5), description: desc, quantity: 1, unitPrice: price }]);
  }
  function updLine(id: string, f: keyof LineItem, v: string | number) { setLines(p => p.map(l => l.id === id ? { ...l, [f]: v } : l)); }
  function rmLine(id: string) { setLines(p => p.filter(l => l.id !== id)); }

  function reset() {
    setInvNo(genInvNo()); setInvDate(new Date().toISOString().split("T")[0]);
    setBookRef(""); setFName(""); setLName(""); setEmail(""); setCountry("");
    setProp("The Riad"); setRoom(""); setCin(""); setCout("");
    setGCount(2); setRate(0); setInclTax(true); setLines([]);
    setDType("none"); setDVal(""); setPayMethod("PayPal"); setPayStatus("Paid");
    setNotes(""); setMode("pick");
  }

  // ── PDF ──
  function genPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 22;
    let y = 24;

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(42, 37, 32);
    doc.text("Riad di Siena", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 125, 118);
    y += 6; doc.text("37 Derb Fhal Zefriti, Laksour · Marrakech Medina 40000 · Morocco", M, y);
    y += 3.5; doc.text("happy@riaddisiena.com · riaddisiena.com", M, y);

    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(42, 37, 32);
    doc.text(invNo, W - M, 24, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 125, 118);
    doc.text(fmtDate(invDate), W - M, 30, { align: "right" });

    y += 8; doc.setDrawColor(42, 37, 32); doc.setLineWidth(0.15); doc.line(M, y, W - M, y); y += 10;

    const c2 = W / 2 + 8;
    doc.setFontSize(7.5); doc.setTextColor(160, 155, 148);
    doc.text("BILLED TO", M, y); doc.text("STAY DETAILS", c2, y); y += 5;

    const fullN = [fName, lName].filter(Boolean).join(" ") || "Guest";
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(42, 37, 32);
    doc.text(fullN, M, y); doc.text(prop || "—", c2, y);

    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(100, 95, 88);
    let yL = y + 5;
    if (email) { doc.text(email, M, yL); yL += 4; }
    if (country) { doc.text(country, M, yL); yL += 4; }

    let yR = y + 5;
    if (room) { doc.text(room, c2, yR); yR += 4; }
    if (cin || cout) { doc.text(`${fmtDate(cin)} → ${fmtDate(cout)}`, c2, yR); yR += 4; }
    doc.text(`${n} night${n !== 1 ? "s" : ""} · ${gCount} guest${gCount !== 1 ? "s" : ""}`, c2, yR); yR += 4;
    if (bookRef) { doc.setFontSize(7.5); doc.setTextColor(170, 165, 158); doc.text(`Ref: ${bookRef}`, c2, yR); yR += 4; }

    y = Math.max(yL, yR) + 8;

    const rows: (string | number)[][] = [];
    if (n > 0 && rate > 0) rows.push([`Accommodation — ${room || prop}`, `${n}`, eur(rate), eur(roomTot)]);
    if (inclTax && tax > 0) rows.push([`City Tax (€${CITY_TAX.toFixed(2)} × ${gCount} × ${n})`, "1", eur(tax), eur(tax)]);
    for (const l of lines) { if (l.description) rows.push([l.description, String(l.quantity), eur(l.unitPrice), eur(l.quantity * l.unitPrice)]); }

    autoTable(doc, {
      startY: y,
      head: [["Description", "Qty", "Unit Price", "Amount"]],
      body: rows,
      theme: "plain",
      margin: { left: M, right: M },
      headStyles: { fillColor: [245, 240, 232], textColor: [42, 37, 32], fontStyle: "normal", fontSize: 7.5, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 } },
      bodyStyles: { textColor: [70, 65, 58], fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 16, halign: "center" }, 2: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 28, halign: "right", fontStyle: "bold" } },
      alternateRowStyles: { fillColor: [250, 248, 245] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
    const tL = W - M - 58, tR = W - M;

    doc.setFontSize(8.5); doc.setTextColor(130, 125, 118);
    doc.text("Subtotal", tL, y); doc.setTextColor(42, 37, 32); doc.text(eur(sub), tR, y, { align: "right" }); y += 5;
    if (disc > 0) { doc.setTextColor(130, 125, 118); doc.text(dType === "percent" ? `Discount (${dVal}%)` : "Discount", tL, y); doc.setTextColor(180, 60, 60); doc.text(`−${eur(disc)}`, tR, y, { align: "right" }); y += 5; }

    doc.setDrawColor(42, 37, 32); doc.setLineWidth(0.4); doc.line(tL - 2, y, tR, y); y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(42, 37, 32);
    doc.text("Total", tL, y); doc.text(eur(total), tR, y, { align: "right" }); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    if (payStatus === "Paid") { doc.setTextColor(60, 130, 60); doc.text(`✓ ${payStatus} via ${payMethod}`, tL, y); }
    else { doc.setTextColor(180, 130, 40); doc.text(`○ ${payStatus}`, tL, y); }

    if (notes) {
      y += 12; doc.setFontSize(7.5); doc.setTextColor(160, 155, 148); doc.text("NOTES", M, y);
      y += 5; doc.setFontSize(8.5); doc.setTextColor(100, 95, 88);
      doc.text(doc.splitTextToSize(notes, W - M * 2), M, y);
    }

    const fY = doc.internal.pageSize.getHeight() - 14;
    doc.setDrawColor(220, 215, 210); doc.setLineWidth(0.15); doc.line(M, fY - 4, W - M, fY - 4);
    doc.setFontSize(7); doc.setTextColor(170, 165, 158);
    doc.text("Riad di Siena · 37 Derb Fhal Zefriti, Laksour · Marrakech 40000 · Morocco", W / 2, fY, { align: "center" });
    doc.text("riaddisiena.com", W / 2, fY + 3.5, { align: "center" });

    doc.save(`${invNo}_${lName || "guest"}.pdf`);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: PICK MODE
  // ═══════════════════════════════════════════════════════════
  if (mode === "pick") return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-black/30 hover:text-black/60 transition-colors">← Dashboard</Link>
          <div className="w-px h-4 bg-black/8" />
          <h1 className="text-[15px] font-medium tracking-tight">Invoice</h1>
        </div>
      </header>
      <div className="max-w-md mx-auto px-6 pt-20 pb-16">
        <p className="text-[9.5px] tracking-[0.2em] uppercase text-black/25 mb-3">New Invoice</p>
        <h2 className="font-serif text-[30px] leading-[1.15] text-black/85 mb-12">
          Import a booking<br />or start from scratch.
        </h2>

        {/* Search */}
        <div className="relative mb-6" ref={ddRef}>
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text" value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setShowDD(true); }}
            onFocus={() => setShowDD(true)}
            placeholder={loading ? "Loading bookings…" : "Search name, booking ID, email…"}
            className="w-full pl-11 pr-4 py-3.5 text-[13px] bg-white border border-black/8 rounded-xl focus:outline-none focus:border-black/18 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          />
          {showDD && searchQ.trim() && filtered.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-black/8 rounded-xl shadow-lg max-h-64 overflow-y-auto scrollbar-hide">
              {filtered.map(g => (
                <button key={g.booking_id} onClick={() => fillBooking(g)} className="w-full text-left px-4 py-3 hover:bg-black/[0.015] transition-colors border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-black/75">{g.guest_name}</span>
                    <span className="text-[9px] text-black/20 font-mono">{g.booking_id}</span>
                  </div>
                  <div className="text-[10px] text-black/30 mt-0.5">
                    {g.room}{g.check_in ? ` · ${fmtDate(g.check_in.split("T")[0])}` : ""}{g.source ? ` · ${g.source}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 border-t border-black/6" />
          <span className="text-[10px] text-black/20">or</span>
          <div className="flex-1 border-t border-black/6" />
        </div>

        <button onClick={() => setMode("form")} className="w-full py-3.5 text-[12px] font-medium tracking-wide border border-black/10 rounded-xl hover:bg-black hover:text-white transition-all duration-200">
          Enter manually
        </button>
        <p className="text-center text-[10px] text-black/25 mt-2">WhatsApp bookings, direct payments, custom invoices</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER: FORM MODE
  // ═══════════════════════════════════════════════════════════
  if (mode === "form") return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-black/[0.06] bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-[13px] text-black/25 hover:text-black/50 transition-colors">← Back</button>
            <div className="w-px h-3.5 bg-black/8" />
            <span className="text-[12px] text-black/40 font-mono">{invNo}</span>
          </div>
          <button onClick={() => setMode("preview")} className="px-5 py-2 text-[11px] font-medium bg-black text-white rounded-lg hover:bg-black/80 transition-colors">
            Preview →
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Meta */}
        <div className="bg-white border border-black/[0.04] rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><Label>Invoice No.</Label><input type="text" value={invNo} onChange={e => setInvNo(e.target.value)} className={inp} /></div>
            <div><Label>Date</Label><input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className={inp} /></div>
            <div><Label>Payment</Label><select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={sel}>{["PayPal", "Bank Transfer", "Cash", "Booking.com", "Airbnb", "Other"].map(m => <option key={m}>{m}</option>)}</select></div>
            <div><Label>Status</Label><select value={payStatus} onChange={e => setPayStatus(e.target.value)} className={sel}>{["Paid", "Pending", "Partial", "Overdue", "Refunded"].map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
        </div>

        {/* Guest */}
        <div className="bg-white border border-black/[0.04] rounded-xl p-6">
          <p className="text-[9px] tracking-[0.2em] uppercase text-black/25 mb-5">Guest</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><Label>First Name</Label><input type="text" value={fName} onChange={e => setFName(e.target.value)} className={inp} /></div>
            <div><Label>Last Name</Label><input type="text" value={lName} onChange={e => setLName(e.target.value)} className={inp} /></div>
            <div><Label>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
            <div><Label>Country</Label><input type="text" value={country} onChange={e => setCountry(e.target.value)} className={inp} /></div>
          </div>
        </div>

        {/* Stay */}
        <div className="bg-white border border-black/[0.04] rounded-xl p-6">
          <p className="text-[9px] tracking-[0.2em] uppercase text-black/25 mb-5">Stay</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
            <div><Label>Property</Label><select value={prop} onChange={e => { setProp(e.target.value); setRoom(""); }} className={sel}><option>The Riad</option><option>The Douaria</option><option>The Kasbah</option><option>The Desert Camp</option></select></div>
            <div><Label>Room</Label><input type="text" value={room} onChange={e => setRoom(e.target.value)} list="rms" placeholder="Select or type" className={inp} /><datalist id="rms">{(prop === "The Riad" ? RIAD_ROOMS : prop === "The Douaria" ? DOUARIA_ROOMS : []).map(r => <option key={r} value={r} />)}</datalist></div>
            <div><Label>Check-in</Label><input type="date" value={cin} onChange={e => setCin(e.target.value)} className={inp} /></div>
            <div><Label>Check-out</Label><input type="date" value={cout} onChange={e => setCout(e.target.value)} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
            <div>
              <Label>Guests</Label>
              <div className="flex items-center gap-3 py-1.5">
                <button onClick={() => setGCount(Math.max(1, gCount - 1))} className="w-7 h-7 flex items-center justify-center border border-black/10 rounded text-black/40 hover:text-black hover:border-black/25 transition-colors">−</button>
                <span className="text-[14px] font-medium w-4 text-center">{gCount}</span>
                <button onClick={() => setGCount(gCount + 1)} className="w-7 h-7 flex items-center justify-center border border-black/10 rounded text-black/40 hover:text-black hover:border-black/25 transition-colors">+</button>
              </div>
            </div>
            <div><Label>Nightly Rate (€)</Label><input type="number" value={rate || ""} onChange={e => setRate(parseFloat(e.target.value) || 0)} placeholder="0" className={inp} /></div>
            <div className="col-span-2 flex items-center justify-between pt-2">
              {n > 0 && rate > 0 ? <span className="text-[12px] text-black/35">{n} nights × {eur(rate)} = <span className="text-black/70 font-medium">{eur(roomTot)}</span></span> : <span />}
              <button onClick={() => setInclTax(!inclTax)} className="flex items-center gap-1.5 text-[10px] text-black/35">
                <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${inclTax ? "bg-black border-black" : "border-black/15"}`}>
                  {inclTax && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </span>
                City tax {eur(tax)}
              </button>
            </div>
          </div>
        </div>

        {/* Extras */}
        <div className="bg-white border border-black/[0.04] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase text-black/25">Additional</p>
            <button onClick={() => addLine()} className="text-[10px] text-black/30 hover:text-black/50 transition-colors">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {([["Airport Transfer", 25], ["Dinner (pp)", 35], ["Hammam", 45], ["Cooking Class (pp)", 55], ["Medina Tour", 40], ["Laundry", 15], ["Late Checkout", 30]] as [string, number][]).map(([nm, pr]) => (
              <button key={nm} onClick={() => addLine(nm, pr)} className="px-2.5 py-1 text-[9.5px] border border-black/5 rounded hover:border-black/12 transition-colors text-black/40">
                {nm} <span className="text-black/18">€{pr}</span>
              </button>
            ))}
          </div>
          {lines.length > 0 && <div className="space-y-2">{lines.map(l => (
            <div key={l.id} className="grid grid-cols-12 gap-2 items-center">
              <input type="text" value={l.description} onChange={e => updLine(l.id, "description", e.target.value)} placeholder="Description" className={`col-span-6 ${inp}`} />
              <input type="number" value={l.quantity} onChange={e => updLine(l.id, "quantity", parseInt(e.target.value) || 1)} min={1} className={`col-span-2 text-center ${inp}`} />
              <input type="number" value={l.unitPrice || ""} onChange={e => updLine(l.id, "unitPrice", parseFloat(e.target.value) || 0)} placeholder="€" className={`col-span-2 text-right ${inp}`} />
              <span className="col-span-1 text-right text-[11px] font-medium text-black/50">{eur(l.quantity * l.unitPrice)}</span>
              <button onClick={() => rmLine(l.id)} className="col-span-1 text-right text-black/12 hover:text-red-400 transition-colors"><svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          ))}</div>}
        </div>

        {/* Bottom: Discount + Notes | Total */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white border border-black/[0.04] rounded-xl p-6">
              <p className="text-[9px] tracking-[0.2em] uppercase text-black/25 mb-3">Discount</p>
              <div className="flex gap-1.5 mb-3">
                {(["none", "percent", "fixed"] as const).map(t => (
                  <button key={t} onClick={() => setDType(t)} className={`px-3 py-1.5 text-[10px] rounded border transition-all ${dType === t ? "bg-black text-white border-black" : "border-black/6 text-black/35"}`}>
                    {t === "none" ? "None" : t === "percent" ? "%" : "€"}
                  </button>
                ))}
              </div>
              {dType !== "none" && <input type="number" value={dVal} onChange={e => setDVal(e.target.value)} placeholder={dType === "percent" ? "e.g. 10" : "e.g. 50"} className={inp + " max-w-[180px]"} />}
            </div>
            <div className="bg-white border border-black/[0.04] rounded-xl p-6">
              <p className="text-[9px] tracking-[0.2em] uppercase text-black/25 mb-3">Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Thank you for staying with us…" className="w-full px-3 py-2.5 text-[13px] bg-transparent border border-black/8 rounded-lg focus:border-black/20 focus:outline-none transition-colors resize-none placeholder:text-black/18" />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-black/[0.04] rounded-xl p-6 flex flex-col">
            <div className="space-y-2.5 text-[12px] flex-1">
              {roomTot > 0 && <div className="flex justify-between"><span className="text-black/30">Accommodation</span><span>{eur(roomTot)}</span></div>}
              {tax > 0 && <div className="flex justify-between"><span className="text-black/30">City Tax</span><span>{eur(tax)}</span></div>}
              {extrasTot > 0 && <div className="flex justify-between"><span className="text-black/30">Extras</span><span>{eur(extrasTot)}</span></div>}
              <div className="border-t border-black/5 pt-2.5 flex justify-between"><span className="text-black/30">Subtotal</span><span>{eur(sub)}</span></div>
              {disc > 0 && <div className="flex justify-between"><span className="text-black/30">Discount</span><span className="text-red-500/60">−{eur(disc)}</span></div>}
              <div className="border-t-2 border-black pt-3 flex items-baseline justify-between">
                <span className="font-medium text-[13px]">Total</span>
                <span className="text-[24px] font-serif font-semibold tracking-tight">{eur(total)}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] self-start ${payStatus === "Paid" ? "bg-green-50 text-green-700" : payStatus === "Overdue" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${payStatus === "Paid" ? "bg-green-500" : payStatus === "Overdue" ? "bg-red-500" : "bg-amber-500"}`} />
                {payStatus} · {payMethod}
              </span>
            </div>
            <button onClick={() => setMode("preview")} className="w-full mt-5 py-3 text-[11px] font-medium tracking-wide bg-black text-white rounded-lg hover:bg-black/80 transition-colors">
              Preview →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER: PREVIEW MODE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-black/[0.06] bg-white sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => setMode("form")} className="text-[13px] text-black/25 hover:text-black/50 transition-colors">← Edit</button>
          <div className="flex items-center gap-2">
            <button onClick={genPDF} className="px-5 py-2 text-[11px] font-medium bg-black text-white rounded-lg hover:bg-black/80 transition-colors">Download PDF</button>
            <button onClick={reset} className="px-3 py-2 text-[11px] text-black/25 hover:text-black/50 transition-colors">New</button>
          </div>
        </div>
      </header>

      <div className="max-w-[620px] mx-auto px-6 py-10 mb-16">
        <div className="bg-white border border-black/[0.04] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Header */}
          <div className="px-10 pt-10 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-serif text-[24px] tracking-tight text-[#2a2520]">Riad di Siena</h2>
                <p className="text-[9px] text-[#2a2520]/30 mt-1.5 leading-[1.6]">37 Derb Fhal Zefriti, Laksour<br />Marrakech Medina 40000 · Morocco<br />happy@riaddisiena.com</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-medium text-[#2a2520]">{invNo}</p>
                <p className="text-[9px] text-[#2a2520]/30 mt-1">{fmtDate(invDate)}</p>
              </div>
            </div>
          </div>

          <div className="mx-10 border-t border-[#2a2520]/8" />

          {/* Billed + Stay */}
          <div className="px-10 py-6 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[7.5px] tracking-[0.2em] uppercase text-[#2a2520]/20 mb-2">Billed To</p>
              <p className="text-[12px] font-medium text-[#2a2520]">{[fName, lName].filter(Boolean).join(" ") || "—"}</p>
              {email && <p className="text-[10px] text-[#2a2520]/35 mt-0.5">{email}</p>}
              {country && <p className="text-[10px] text-[#2a2520]/35">{country}</p>}
            </div>
            <div>
              <p className="text-[7.5px] tracking-[0.2em] uppercase text-[#2a2520]/20 mb-2">Stay</p>
              <p className="text-[12px] font-medium text-[#2a2520]">{prop}</p>
              {room && <p className="text-[10px] text-[#2a2520]/35 mt-0.5">{room}</p>}
              <p className="text-[10px] text-[#2a2520]/35">{fmtDate(cin)} → {fmtDate(cout)}</p>
              <p className="text-[10px] text-[#2a2520]/35">{n} night{n !== 1 ? "s" : ""} · {gCount} guest{gCount !== 1 ? "s" : ""}</p>
              {bookRef && <p className="text-[8px] text-[#2a2520]/15 mt-1 font-mono">{bookRef}</p>}
            </div>
          </div>

          {/* Table */}
          <div className="px-10 pb-3">
            <table className="w-full text-[10px]">
              <thead><tr className="border-b border-[#2a2520]/8">
                <th className="py-2 text-left font-normal text-[7.5px] tracking-[0.15em] uppercase text-[#2a2520]/20">Description</th>
                <th className="py-2 text-center font-normal text-[7.5px] tracking-[0.15em] uppercase text-[#2a2520]/20 w-10">Qty</th>
                <th className="py-2 text-right font-normal text-[7.5px] tracking-[0.15em] uppercase text-[#2a2520]/20 w-18">Rate</th>
                <th className="py-2 text-right font-normal text-[7.5px] tracking-[0.15em] uppercase text-[#2a2520]/20 w-18">Amount</th>
              </tr></thead>
              <tbody className="text-[#2a2520]/60">
                {n > 0 && rate > 0 && <tr className="border-b border-[#2a2520]/[0.04]"><td className="py-2">Accommodation — {room || prop}</td><td className="py-2 text-center">{n}</td><td className="py-2 text-right">{eur(rate)}</td><td className="py-2 text-right text-[#2a2520] font-medium">{eur(roomTot)}</td></tr>}
                {inclTax && tax > 0 && <tr className="border-b border-[#2a2520]/[0.04]"><td className="py-2">City Tax (€{CITY_TAX.toFixed(2)} × {gCount} × {n})</td><td className="py-2 text-center">1</td><td className="py-2 text-right">{eur(tax)}</td><td className="py-2 text-right text-[#2a2520] font-medium">{eur(tax)}</td></tr>}
                {lines.filter(l => l.description).map(l => <tr key={l.id} className="border-b border-[#2a2520]/[0.04]"><td className="py-2">{l.description}</td><td className="py-2 text-center">{l.quantity}</td><td className="py-2 text-right">{eur(l.unitPrice)}</td><td className="py-2 text-right text-[#2a2520] font-medium">{eur(l.quantity * l.unitPrice)}</td></tr>)}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-10 py-5">
            <div className="ml-auto w-52 space-y-1.5 text-[10px]">
              <div className="flex justify-between"><span className="text-[#2a2520]/25">Subtotal</span><span className="text-[#2a2520]/60">{eur(sub)}</span></div>
              {disc > 0 && <div className="flex justify-between"><span className="text-[#2a2520]/25">Discount{dType === "percent" ? ` (${dVal}%)` : ""}</span><span className="text-red-500/60">−{eur(disc)}</span></div>}
              <div className="border-t-2 border-[#2a2520] pt-2.5 flex items-baseline justify-between">
                <span className="text-[11px] font-medium text-[#2a2520]">Total</span>
                <span className="text-[18px] font-serif font-semibold tracking-tight text-[#2a2520]">{eur(total)}</span>
              </div>
              <span className={`text-[9px] ${payStatus === "Paid" ? "text-green-600" : "text-amber-600"}`}>
                {payStatus === "Paid" ? "✓" : "○"} {payStatus} · {payMethod}
              </span>
            </div>
          </div>

          {notes && <div className="px-10 pb-5"><p className="text-[7.5px] tracking-[0.2em] uppercase text-[#2a2520]/15 mb-1">Notes</p><p className="text-[9px] text-[#2a2520]/35 whitespace-pre-wrap leading-relaxed">{notes}</p></div>}

          <div className="mx-10 border-t border-[#2a2520]/5" />
          <div className="px-10 py-4 text-center">
            <p className="text-[7px] text-[#2a2520]/15 leading-relaxed">Riad di Siena · 37 Derb Fhal Zefriti, Laksour · Marrakech Medina 40000 · Morocco<br />riaddisiena.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePageWrapped() {
  return <PasswordGate><InvoicePage /></PasswordGate>;
}
