"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getCustomers, getPayments, getSales, getExpenses } from "../lib/firebaseUtils";
import { calculateStatus } from "../lib/customerUtils";
import { Customer, Payment, Sale, Expense } from "../lib/types";
import Navbar from "../components/Navbar";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function StatCard({
  label,
  value,
  color,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  color: "green" | "orange" | "blue" | "purple" | "red";
  icon: React.ReactNode;
  href?: string;
}) {
  const colors = {
    green:  { bg: "bg-green-50/60 border-green-100",  icon: "bg-green-100 text-green-600",  text: "text-green-700"  },
    orange: { bg: "bg-orange-50/60 border-orange-100", icon: "bg-orange-100 text-orange-600", text: "text-orange-700" },
    blue:   { bg: "bg-blue-50/60 border-blue-100",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-700"   },
    purple: { bg: "bg-purple-50/60 border-purple-100", icon: "bg-purple-100 text-purple-600", text: "text-purple-700" },
    red:    { bg: "bg-red-50/60 border-red-100",    icon: "bg-red-100 text-red-600",    text: "text-red-700"    },
  }[color];

  const inner = (
    <div className={`border ${colors.bg} rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 ${href ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" : ""}`}>
      <div className={`${colors.icon} rounded-xl p-3 shrink-0`}>{icon}</div>
      <div className="text-right">
        <p className="text-xs text-gray-500 font-bold leading-snug">{label}</p>
        <p className={`text-xl sm:text-2xl font-black mt-0.5 ${colors.text}`}>{value}</p>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  useEffect(() => {
    async function load() {
      const [c, p, s, e] = await Promise.all([
        getCustomers(),
        getPayments(),
        getSales(),
        getExpenses(),
      ]);
      setCustomers(c);
      setPayments(p);
      setSales(s);
      setExpenses(e);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    seen.add(`${now.getFullYear()}-${now.getMonth()}`);

    for (const c of customers) {
      const d = new Date(c.startDate);
      seen.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    for (const p of payments) {
      const d = new Date(p.date);
      seen.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    for (const s of sales) {
      const d = new Date(s.date);
      seen.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    for (const e of expenses) {
      const d = new Date(e.date);
      seen.add(`${d.getFullYear()}-${d.getMonth()}`);
    }

    return Array.from(seen)
      .map((key) => {
        const [y, m] = key.split("-").map(Number);
        return { year: y, month: m };
      })
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  }, [customers, payments, sales, expenses]);

  const stats = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const monthStart = `${monthPrefix}-01`;
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthEnd = `${monthPrefix}-${String(lastDay).padStart(2, "0")}`;

    function normalizeDate(raw: unknown): string {
      if (!raw) return "";
      if (typeof raw === "object" && raw !== null && "seconds" in raw) {
        const ts = raw as { seconds: number };
        return new Date(ts.seconds * 1000).toISOString().slice(0, 10);
      }
      if (typeof raw === "object" && raw !== null && "toDate" in raw) {
        return (raw as { toDate(): Date }).toDate().toISOString().slice(0, 10);
      }
      if (typeof raw === "string") return raw.slice(0, 10);
      return String(raw).slice(0, 10);
    }

    const filteredPayments = payments.filter((p) => {
      const d = normalizeDate(p.date);
      return d.startsWith(monthPrefix);
    });

    const subscriptionRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    const activeMembers = customers.filter(
      (c) => c.startDate <= monthEnd && c.endDate >= monthStart
    ).length;

    const expiringSoon = customers.filter(
      (c) =>
        c.subscriptionType === "monthly" &&
        calculateStatus(c.endDate, c.subscriptionType) === "expiring"
    ).length;

    const expiredThisMonth = customers.filter(
      (c) =>
        c.subscriptionType === "monthly" &&
        calculateStatus(c.endDate, c.subscriptionType) === "expired"
    ).length;

    const salesRevenue = sales
      .filter((s) => { const d = normalizeDate(s.date); return d >= monthStart && d <= monthEnd; })
      .reduce((sum, s) => sum + (s.profit ?? 0), 0);

    const totalExpenses = expenses
      .filter((e) => { const d = normalizeDate(e.date); return d >= monthStart && d <= monthEnd; })
      .reduce((sum, e) => sum + e.price, 0);

    const netProfit = subscriptionRevenue + salesRevenue - totalExpenses;

    return { activeMembers, expiringSoon, subscriptionRevenue, expiredThisMonth, salesRevenue, totalExpenses, netProfit };
  }, [customers, payments, sales, expenses, selectedYear, selectedMonth]);

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">نظرة عامة</h2>
          
          <div className="flex items-center gap-2">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
            >
              {monthOptions.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {ARABIC_MONTHS[month]} {year}
                </option>
              ))}
            </select>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="sm:hidden p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition shadow-sm active:scale-95"
              title="تسجيل الخروج"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse border border-gray-150" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="الأعضاء النشطون"
              value={stats.activeMembers}
              color="green"
              href={isCurrentMonth ? "/customers?filter=active" : undefined}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="اشتراكات تنتهي هذا الشهر"
              value={stats.expiringSoon}
              color="orange"
              href={isCurrentMonth ? "/customers?filter=expiring" : undefined}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="إيرادات الاشتراكات"
              value={`${stats.subscriptionRevenue.toLocaleString()} جنيه`}
              color="blue"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="اشتراكات منتهية"
              value={stats.expiredThisMonth}
              color="red"
              href="/customers?filter=expired"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="فائض المبيعات"
              value={`${stats.salesRevenue.toLocaleString()} جنيه`}
              color="green"
              href="/sales"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatCard
              label="المصاريف"
              value={`${stats.totalExpenses.toLocaleString()} جنيه`}
              color="red"
              href="/expenses"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatCard
              label="صافي الربح"
              value={`${stats.netProfit.toLocaleString()} جنيه`}
              color="blue"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
