"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { getPayments, getSales, getExpenses } from "../lib/firebaseUtils";
import { Payment, Sale, Expense } from "../lib/types";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthLabel(prefix: string) {
  const [y, m] = prefix.split("-").map(Number);
  return `${ARABIC_MONTHS[m - 1]} ${y}`;
}

function normalizeDate(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "object" && raw !== null && "seconds" in raw)
    return new Date((raw as { seconds: number }).seconds * 1000).toISOString().slice(0, 10);
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate(): Date }).toDate().toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

function toPrefix(date: string) {
  return date.slice(0, 7); // "YYYY-MM"
}

type QuickRange = "month" | "3months" | "6months" | "year" | "custom";

interface MonthRow {
  prefix: string;
  subscriptions: number;
  sales: number;
  expenses: number;
  net: number;
  total: number;
}

function SummaryCard({
  label, value, color,
}: { label: string; value: string; color: "blue" | "green" | "red" | "yellow" }) {
  const styles = {
    blue:   "bg-blue-50/60 border-blue-150 text-blue-700",
    green:  "bg-green-50/60 border-green-150 text-green-700",
    red:    "bg-red-50/60 border-red-150 text-red-700",
    yellow: "bg-yellow-50/60 border-yellow-150 text-yellow-700",
  }[color];
  return (
    <div className={`border ${styles} rounded-2xl p-5 shadow-sm`}>
      <p className="text-xs font-bold opacity-75 mb-1">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [quickRange, setQuickRange] = useState<QuickRange>("month");
  const [customFrom, setCustomFrom] = useState(currentPrefix);
  const [customTo, setCustomTo] = useState(currentPrefix);

  useEffect(() => {
    async function load() {
      const [p, s, e] = await Promise.all([getPayments(), getSales(), getExpenses()]);
      setPayments(p);
      setSales(s);
      setExpenses(e);
      setLoading(false);
    }
    load();
  }, []);

  // Build all available month prefixes from data
  const allPrefixes = useMemo(() => {
    const seen = new Set<string>();
    seen.add(currentPrefix);
    [...payments, ...sales, ...expenses].forEach((r) => {
      const d = normalizeDate((r as unknown as Record<string, unknown>).date);
      if (d) seen.add(toPrefix(d));
    });
    return Array.from(seen).sort();
  }, [payments, sales, expenses, currentPrefix]);

  // Derive from/to from quick range
  const { fromPrefix, toPrefix: toP } = useMemo(() => {
    if (quickRange === "custom") return { fromPrefix: customFrom, toPrefix: customTo };
    const idx = allPrefixes.indexOf(currentPrefix);
    const safeIdx = idx === -1 ? allPrefixes.length - 1 : idx;
    const map: Record<QuickRange, number> = { month: 0, "3months": 2, "6months": 5, year: 11, custom: 0 };
    const back = map[quickRange];
    const fromIdx = Math.max(0, safeIdx - back);
    return { fromPrefix: allPrefixes[fromIdx] ?? currentPrefix, toPrefix: allPrefixes[safeIdx] ?? currentPrefix };
  }, [quickRange, customFrom, customTo, allPrefixes, currentPrefix]);

  // Group into monthly rows
  const rows: MonthRow[] = useMemo(() => {
    const map = new Map<string, MonthRow>();

    const ensure = (prefix: string) => {
      if (!map.has(prefix))
        map.set(prefix, { prefix, subscriptions: 0, sales: 0, expenses: 0, net: 0, total: 0 });
      return map.get(prefix)!;
    };

    payments.forEach((p) => {
      const prefix = toPrefix(normalizeDate(p.date));
      if (prefix >= fromPrefix && prefix <= toP) ensure(prefix).subscriptions += p.amount;
    });
    sales.forEach((s) => {
      const prefix = toPrefix(normalizeDate(s.date));
      if (prefix >= fromPrefix && prefix <= toP) ensure(prefix).sales += s.price;
    });
    expenses.forEach((e) => {
      const prefix = toPrefix(normalizeDate(e.date));
      if (prefix >= fromPrefix && prefix <= toP) ensure(prefix).expenses += e.price;
    });

    map.forEach((row) => {
      row.net = row.subscriptions + row.sales - row.expenses;
      row.total = row.subscriptions + row.sales;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [payments, sales, expenses, fromPrefix, toP]);

  const maxTotal = rows.reduce((m, r) => Math.max(m, r.total), 1);
  const bestRow = rows[0] ?? null;

  const totals = useMemo(() => ({
    subscriptions: rows.reduce((s, r) => s + r.subscriptions, 0),
    sales: rows.reduce((s, r) => s + r.sales, 0),
    expenses: rows.reduce((s, r) => s + r.expenses, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  }), [rows]);

  const monthOptions = useMemo(() =>
    [...allPrefixes].sort((a, b) => b.localeCompare(a)).map((p) => ({ value: p, label: monthLabel(p) })),
    [allPrefixes]);

  const quickBtns: { key: QuickRange; label: string }[] = [
    { key: "month", label: "هذا الشهر" },
    { key: "3months", label: "آخر 3 شهور" },
    { key: "6months", label: "آخر 6 شهور" },
    { key: "year", label: "هذه السنة" },
  ];

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">التقارير</h2>

        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setQuickRange(key)}
              className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 active:scale-95 ${
                quickRange === key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setQuickRange("custom")}
            className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 active:scale-95 ${
              quickRange === "custom"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            مخصص
          </button>
        </div>

        {/* Custom range dropdowns */}
        {quickRange === "custom" && (
          <div className="flex items-center gap-3 mb-6 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm">
            <select
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="text-gray-400 text-sm font-bold shrink-0">إلى</span>
            <select
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse border border-gray-150" />)}
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse border border-gray-150" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                label="إجمالي الإيرادات"
                value={`${totals.total.toLocaleString()} جنيه`}
                color="blue"
              />
              <SummaryCard
                label="إجمالي المصاريف"
                value={`${totals.expenses.toLocaleString()} جنيه`}
                color="red"
              />
              <SummaryCard
                label="صافي الربح"
                value={`${totals.net.toLocaleString()} جنيه`}
                color="green"
              />
              <SummaryCard
                label="أفضل شهر"
                value={bestRow ? `${monthLabel(bestRow.prefix)} · ${bestRow.total.toLocaleString()} جنيه` : "—"}
                color="yellow"
              />
            </div>

            {/* Comparison view */}
            {rows.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-200">لا توجد بيانات للفترة المحددة.</p>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-base mb-2 px-1">مقارنة الإيرادات الشهرية</h3>
                
                {/* Mobile view cards (sm:hidden) */}
                <div className="sm:hidden space-y-3">
                  {rows.map((row) => {
                    const isBest = row === bestRow;
                    const barWidth = Math.round((row.total / maxTotal) * 100);
                    return (
                      <div
                        key={row.prefix}
                        className={`border rounded-2xl p-4 bg-white transition-all shadow-sm ${
                          isBest ? "border-yellow-200 bg-yellow-50/20" : "border-gray-150"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            {isBest && <span title="أفضل شهر" className="text-base">🏆</span>}
                            <span className="font-bold text-gray-900 text-sm">{monthLabel(row.prefix)}</span>
                          </div>
                          <span className={`text-xs font-black ${isBest ? "text-yellow-600" : "text-blue-600"}`}>
                            {barWidth}%
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isBest ? "bg-yellow-400" : "bg-blue-500"}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                          <div>
                            <p className="text-gray-400 font-bold mb-0.5">إيراد الاشتراكات</p>
                            <p className="text-gray-800 font-black">{row.subscriptions.toLocaleString()} جنيه</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-bold mb-0.5">إيراد المبيعات</p>
                            <p className="text-gray-800 font-black">{row.sales.toLocaleString()} جنيه</p>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-gray-200/60 flex justify-between font-bold text-gray-500">
                            <span>المصاريف: <strong className="text-red-500">{row.expenses.toLocaleString()} جنيه</strong></span>
                            <span>الصافي: <strong className={row.net >= 0 ? "text-green-700" : "text-red-700"}>{row.net.toLocaleString()} جنيه</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Mobile total card */}
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-xs font-bold text-gray-700 shadow-sm space-y-2">
                    <p className="text-sm font-black text-gray-800 border-b border-gray-200 pb-2 mb-2">الإجمالي الكلي للفترة</p>
                    <div className="flex justify-between">
                      <span>إجمالي الاشتراكات:</span>
                      <span className="font-black text-gray-900">{totals.subscriptions.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي المبيعات:</span>
                      <span className="font-black text-gray-900">{totals.sales.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي المصاريف:</span>
                      <span className="font-black text-red-500">{totals.expenses.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span>صافي الأرباح:</span>
                      <span className={`font-black ${totals.net >= 0 ? "text-green-600" : "text-red-600"}`}>{totals.net.toLocaleString()} جنيه</span>
                    </div>
                  </div>
                </div>

                {/* Desktop View Table (hidden sm:block) */}
                <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-right">
                          <th className="px-5 py-4.5 font-bold text-gray-600">الشهر</th>
                          <th className="px-5 py-4.5 font-bold text-gray-600">إيرادات الاشتراكات</th>
                          <th className="px-5 py-4.5 font-bold text-gray-600">إيرادات المبيعات</th>
                          <th className="px-5 py-4.5 font-bold text-gray-600">المصاريف</th>
                          <th className="px-5 py-4.5 font-bold text-gray-600">صافي الربح</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => {
                          const isBest = row === bestRow;
                          const barWidth = Math.round((row.total / maxTotal) * 100);
                          return (
                            <tr
                              key={row.prefix}
                              className={isBest ? "bg-yellow-50/30" : "hover:bg-gray-50 transition"}
                            >
                              <td className="px-5 py-4 font-semibold text-gray-900">
                                <div className="flex items-center gap-3">
                                  {isBest && <span title="أفضل شهر" className="text-base">🏆</span>}
                                  <div>
                                    <div className="font-bold">{monthLabel(row.prefix)}</div>
                                    <div className="mt-1.5 h-1.5 w-32 bg-gray-150 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${isBest ? "bg-yellow-400" : "bg-blue-500"}`}
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-gray-700 font-bold">{row.subscriptions.toLocaleString()} جنيه</td>
                              <td className="px-5 py-4 text-gray-700 font-bold">{row.sales.toLocaleString()} جنيه</td>
                              <td className="px-5 py-4 text-red-600 font-semibold">{row.expenses.toLocaleString()} جنيه</td>
                              <td className={`px-5 py-4 font-bold ${row.net >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {row.net.toLocaleString()} جنيه
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-black text-gray-800">
                          <td className="px-5 py-4">الإجمالي</td>
                          <td className="px-5 py-4">{totals.subscriptions.toLocaleString()} جنيه</td>
                          <td className="px-5 py-4">{totals.sales.toLocaleString()} جنيه</td>
                          <td className="px-5 py-4 text-red-600">{totals.expenses.toLocaleString()} جنيه</td>
                          <td className={`px-5 py-4 ${totals.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {totals.net.toLocaleString()} جنيه
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
