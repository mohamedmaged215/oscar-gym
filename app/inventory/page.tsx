"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  addInventoryItem,
  getInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
} from "../lib/firebaseUtils";
import { InventoryItem } from "../lib/types";

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

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [form, setForm] = useState({ itemName: "", costPrice: "", quantity: "" });

  async function load() {
    setLoading(true);
    const data = await getInventoryItems();
    data.sort((a, b) => a.itemName.localeCompare(b.itemName));
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim() || !form.costPrice || !form.quantity) return;
    setSaving(true);
    await addInventoryItem({
      itemName: form.itemName.trim(),
      costPrice: Number(form.costPrice),
      quantity: Number(form.quantity),
    });
    setForm({ itemName: "", costPrice: "", quantity: "" });
    await load();
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteInventoryItem(deleteTarget);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    setDeleteTarget(null);
  }

  async function saveQty(id: string) {
    await updateInventoryItem(id, { quantity: Number(editQty) });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Number(editQty) } : i)));
    setEditingId(null);
  }

  return (
    <div className="min-h-full">
      <Navbar />

      {deleteTarget && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">المشتريات</h2>

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
              placeholder="سعر التكلفة"
              value={form.costPrice}
              onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
              className="w-full sm:w-36 px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <input
              required
              type="number"
              min="0"
              placeholder="الكمية"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full sm:w-28 px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">لا توجد مشتريات.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الصنف</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">سعر التكلفة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الكمية</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.costPrice.toLocaleString()} جنيه</td>
                    <td className="px-4 py-3 text-gray-600">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => saveQty(item.id)}
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setEditQty(String(item.quantity)); }}
                          className="hover:underline text-gray-700"
                        >
                          {item.quantity}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => setDeleteTarget(item.id)}
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
      </main>
    </div>
  );
}
