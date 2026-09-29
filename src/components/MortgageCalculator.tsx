"use client";
import { useState } from "react";
import { money, monthlyPayment } from "@/lib/format";

export default function MortgageCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(25);
  const pay = monthlyPayment(price * (1 - down / 100), rate, years);
  const label = "block text-xs font-medium text-ink-soft";
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-xl font-semibold">Mortgage calculator</h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className={label}>Down payment %<input type="number" min={5} max={100} value={down} onChange={(e) => setDown(+e.target.value)} className="field mt-1" /></label>
        <label className={label}>Rate %<input type="number" min={0} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} className="field mt-1" /></label>
        <label className={label}>Amortization (yrs)<input type="number" min={5} max={30} value={years} onChange={(e) => setYears(+e.target.value)} className="field mt-1" /></label>
      </div>
      <p className="mt-5 rounded-xl bg-paper p-4 font-display text-3xl font-semibold">
        {money(pay)}<span className="font-sans text-sm font-normal text-ink-soft"> / month</span>
      </p>
      <p className="mt-2 text-xs text-ink-soft">Estimate only. Excludes taxes, insurance, and CMHC premiums.</p>
    </section>
  );
}
