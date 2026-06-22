"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { getCustomers, getPayments, getSales, getExpenses, getInventoryItems } from "../lib/firebaseUtils";
import { Customer, Payment, Sale, Expense, InventoryItem } from "../lib/types";

type TxType = "subscription" | "session" | "sale" | "expense" | "inventory";

interface Transaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  type: TxType;
}

const TYPE_LABELS: Record<TxType, string> = {
  subscription: "اشتراك شهري",
  session: "حصة",
  sale: "مبيعات",
  expense: "مصروف",
  inventory: "مشتريات",
};

const TYPE_STYLES: Record<TxType, string> = {
  subscription: "bg-green-50 text-green-700 border-green-200",
  session: "bg-blue-50 text-blue-700 border-blue-200",
  sale: "bg-purple-50 text-purple-700 border-purple-200",
  expense: "bg-red-50 text-red-700 border-red-200",
  inventory: "bg-orange-50 text-orange-700 border-orange-200",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function monthStartStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function TreasuryPage() {
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [dateFrom, setDateFrom] = useState(monthStartStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const isAllTime = dateFrom === "" && dateTo === "";

  useEffect(() => {
    async function load() {
      const [customers, payments, sales, expenses, inventoryItems] = await Promise.all([
        getCustomers(),
        getPayments(),
        getSales(),
        getExpenses(),
        getInventoryItems(),
      ]);

      const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));
      const txs: Transaction[] = [];

      for (const p of payments as Payment[]) {
        const c = customerMap.get(p.customerId);
        const isSession = c?.subscriptionType === "session" || c?.status === "session";
        txs.push({
          id: p.id,
          date: typeof p.date === "string" ? p.date : "",
          label: c ? c.name : "عميل محذوف",
          amount: p.amount,
          type: isSession ? "session" : "subscription",
        });
      }

      for (const s of sales as Sale[]) {
        txs.push({
          id: s.id,
          date: typeof s.date === "string" ? s.date : "",
          label: s.itemName,
          amount: s.sellPrice ?? s.price,
          type: "sale",
        });
      }

      for (const e of expenses as Expense[]) {
        txs.push({
          id: e.id,
          date: typeof e.date === "string" ? e.date : "",
          label: e.expenseName,
          amount: e.price,
          type: "expense",
        });
      }

      for (const item of inventoryItems as InventoryItem[]) {
        txs.push({
          id: item.id,
          date: "",
          label: item.itemName,
          amount: item.costPrice * item.quantity,
          type: "inventory",
        });
      }

      txs.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });

      setAllTransactions(txs);
      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return isAllTime;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [allTransactions, dateFrom, dateTo, isAllTime]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        acc[t.type] += t.amount;
        return acc;
      },
      { subscription: 0, session: 0, sale: 0, expense: 0, inventory: 0 } as Record<TxType, number>
    );
  }, [filtered]);

  const incoming = totals.subscription + totals.session + totals.sale;
  const outgoing = totals.expense + totals.inventory;
  const balance = incoming - outgoing;

  const incomingTxs = filtered.filter((t) => t.type === "subscription" || t.type === "session" || t.type === "sale");
  const outgoingTxs = filtered.filter((t) => t.type === "expense" || t.type === "inventory");

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 pb-24">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse border border-gray-150" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">الخزينة</h2>

        {/* Date range filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-gray-500">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-gray-500">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setDateFrom(monthStartStr()); setDateTo(todayStr()); }}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-bold border transition ${
                !isAllTime && dateFrom === monthStartStr() && dateTo === todayStr()
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-bold border transition ${
                isAllTime
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              كل الوقت
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div className={`rounded-2xl border p-6 mb-6 shadow-sm ${balance >= 0 ? "bg-green-50/60 border-green-150" : "bg-red-50/60 border-red-150"}`}>
          <p className="text-xs font-bold text-gray-500 mb-1">الرصيد الصافي</p>
          <p className={`text-3xl sm:text-4xl font-black ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>
            {balance.toLocaleString()} جنيه
          </p>
          <div className="mt-3.5 pt-3.5 border-t border-gray-200/50 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>إجمالي الوارد: <strong className="text-green-600 text-sm font-black">{incoming.toLocaleString()} جنيه</strong></span>
            <span>إجمالي الصادر: <strong className="text-red-500 text-sm font-black">{outgoing.toLocaleString()} جنيه</strong></span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">اشتراكات شهرية</p>
            <p className="text-lg font-black text-green-700">{totals.subscription.toLocaleString()} جنيه</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">حصص فردية</p>
            <p className="text-lg font-black text-blue-700">{totals.session.toLocaleString()} جنيه</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">المبيعات</p>
            <p className="text-lg font-black text-purple-700">{totals.sale.toLocaleString()} جنيه</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">المصاريف العامة</p>
            <p className="text-lg font-black text-red-600">{totals.expense.toLocaleString()} جنيه</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-bold mb-1">تكلفة المشتريات</p>
            <p className="text-lg font-black text-orange-600">{totals.inventory.toLocaleString()} جنيه</p>
          </div>
        </div>

        {/* Incoming */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-black text-gray-800">تفاصيل الوارد</h3>
            <span className="text-sm font-bold text-green-600">+{incoming.toLocaleString()} جنيه</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {incomingTxs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">لا توجد معاملات واردة.</p>
            ) : (
              <>
                {/* Mobile view cards layout */}
                <div className="sm:hidden divide-y divide-gray-150">
                  {incomingTxs.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">{t.label}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{t.date || "—"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${TYPE_STYLES[t.type]} mb-1.5`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                        <p className="text-green-600 font-black text-sm">+{t.amount.toLocaleString()} جنيه</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-right px-5 py-4 font-bold text-gray-600">البيان</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">النوع</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">المبلغ</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incomingTxs.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-4.5 font-bold text-gray-900">{t.label}</td>
                          <td className="px-5 py-4.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${TYPE_STYLES[t.type]}`}>
                              {TYPE_LABELS[t.type]}
                            </span>
                          </td>
                          <td className="px-5 py-4.5 text-green-600 font-bold">+{t.amount.toLocaleString()} جنيه</td>
                          <td className="px-5 py-4.5 text-gray-500 font-semibold">{t.date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Outgoing */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-black text-gray-800">تفاصيل الصادر</h3>
            <span className="text-sm font-bold text-red-500">-{outgoing.toLocaleString()} جنيه</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {outgoingTxs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">لا توجد معاملات صادرة.</p>
            ) : (
              <>
                {/* Mobile view cards layout */}
                <div className="sm:hidden divide-y divide-gray-150">
                  {outgoingTxs.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">{t.label}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{t.date || "—"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${TYPE_STYLES[t.type]} mb-1.5`}>
                          {TYPE_LABELS[t.type]}
                        </span>
                        <p className="text-red-500 font-black text-sm">-{t.amount.toLocaleString()} جنيه</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-right px-5 py-4 font-bold text-gray-600">البيان</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">النوع</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">المبلغ</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {outgoingTxs.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-4.5 font-bold text-gray-900">{t.label}</td>
                          <td className="px-5 py-4.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${TYPE_STYLES[t.type]}`}>
                              {TYPE_LABELS[t.type]}
                            </span>
                          </td>
                          <td className="px-5 py-4.5 text-red-500 font-bold">-{t.amount.toLocaleString()} جنيه</td>
                          <td className="px-5 py-4.5 text-gray-500 font-semibold">{t.date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
