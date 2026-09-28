"use client";
import { useState } from "react";
import { money, monthlyPayment } from "@/lib/format";

export default function MortgageCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(25);
  const principal = price * (1 - down / 100);
  const pay = monthlyPayment(principal, rate, years);
  const field = "w-full rounded border px-2 py-1";
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">Mortgage calculator</h2>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <label>Down payment %<input type="number" min={5} max={100} value={down} onChange={(e) => setDown(+e.target.value)} className={field} /></label>
        <label>Rate %<input type="number" min={0} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} className={field} /></label>
        <label>Amortization (yrs)<input type="number" min={5} max={30} value={years} onChange={(e) => setYears(+e.target.value)} className={field} /></label>
      </div>
      <p className="mt-3 text-lg font-semibold">{money(pay)}<span className="text-sm font-normal"> / month</span></p>
      <p className="text-xs text-neutral-500">Estimate only. Excludes taxes, insurance, and CMHC premiums.</p>
    </section>
  );
}
