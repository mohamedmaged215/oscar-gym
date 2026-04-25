"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { addSale, getSales, deleteSale } from "../lib/firebaseUtils";
import { Sale } from "../lib/types";

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
        <p className="text-sm text-gray-600 mb-6">هل أنت متأكد من حذف هذا الصنف؟</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">حذف</button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ itemName: "", price: "" });

  async function load() {
    setLoading(true);
    const data = await getSales();
    data.sort((a, b) => b.date.localeCompare(a.date));
    setSales(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim() || !form.price) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await addSale({ itemName: form.itemName.trim(), price: Number(form.price), date: today });
    setForm({ itemName: "", price: "" });
    await load();
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteSale(deleteTarget);
    setSales((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  }

  const total = sales.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-full">
      <Navbar />

      {deleteTarget && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">المبيعات</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              type="text"
              placeholder="اسم الصنف"
              value={form.itemName}
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <input
              required
              type="number"
              min="0"
              placeholder="السعر"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full sm:w-36 px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {saving ? "…" : "إضافة"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 animate-pulse" />)}
            </div>
          ) : sales.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">لا توجد مبيعات.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الصنف</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">السعر</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">التاريخ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.itemName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.price.toLocaleString()} جنيه</td>
                    <td className="px-4 py-3 text-gray-600">{s.date}</td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => setDeleteTarget(s.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        title="حذف"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && sales.length > 0 && (
          <div className="mt-4 flex justify-end">
            <span className="text-sm font-semibold text-gray-700">
              إجمالي المبيعات: <span className="text-blue-700">{total.toLocaleString()} جنيه</span>
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
