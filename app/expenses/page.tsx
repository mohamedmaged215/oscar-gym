"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { addExpense, getExpenses, deleteExpense } from "../lib/firebaseUtils";
import { Expense } from "../lib/types";

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
        <p className="text-sm text-gray-600 mb-6">هل أنت متأكد من حذف هذا المصروف؟</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition">حذف</button>
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 active:scale-95 transition">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ expenseName: "", price: "" });

  async function load() {
    setLoading(true);
    const data = await getExpenses();
    data.sort((a, b) => b.date.localeCompare(a.date));
    setExpenses(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.expenseName.trim() || !form.price) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await addExpense({ expenseName: form.expenseName.trim(), price: Number(form.price), date: today });
    setForm({ expenseName: "", price: "" });
    await load();
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteExpense(deleteTarget);
    setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget));
    setDeleteTarget(null);
  }

  const total = expenses.reduce((sum, e) => sum + e.price, 0);

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />

      {deleteTarget && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">المصاريف</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">اسم المصروف</label>
                <input
                  required
                  type="text"
                  placeholder="اسم المصروف"
                  value={form.expenseName}
                  onChange={(e) => setForm((f) => ({ ...f, expenseName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">المبلغ (جنيه)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="المبلغ"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-red-100 active:scale-[0.98]"
              >
                {saving ? "جارٍ الإضافة…" : "إضافة مصروف"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse border border-gray-150" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-200">لا توجد مصاريف.</p>
        ) : (
          <>
            {/* Mobile View: Cards Layout (sm:hidden) */}
            <div className="sm:hidden space-y-4">
              {expenses.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-gray-900 text-base leading-snug">{e.expenseName}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">{e.date}</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(e.id)}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 active:scale-95 transition"
                      title="حذف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 text-xs">
                    <span className="text-gray-400 font-bold">المبلغ: </span>
                    <span className="text-red-600 font-black text-sm">{e.price.toLocaleString()} جنيه</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table Layout (hidden sm:block) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">المصروف</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">المبلغ</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">التاريخ</th>
                      <th className="text-left px-5 py-4.5 font-bold text-gray-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-bold text-gray-900">{e.expenseName}</td>
                        <td className="px-5 py-4 text-red-600 font-semibold">{e.price.toLocaleString()} جنيه</td>
                        <td className="px-5 py-4 text-gray-600 font-semibold">{e.date}</td>
                        <td className="px-5 py-4 text-left">
                          <button
                            onClick={() => setDeleteTarget(e.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                            title="حذف"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && expenses.length > 0 && (
          <div className="mt-6 flex justify-end bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-sm font-bold text-gray-600">
              إجمالي المصاريف: <span className="text-red-600 font-black text-sm">{total.toLocaleString()} جنيه</span>
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
