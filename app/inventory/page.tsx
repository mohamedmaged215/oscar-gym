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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
        <p className="text-sm text-gray-600 mb-6">هل أنت متأكد من حذف هذا الصنف من المشتريات؟</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition">حذف</button>
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 active:scale-95 transition">إلغاء</button>
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
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />

      {deleteTarget && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">المشتريات</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">اسم الصنف</label>
                <input
                  required
                  type="text"
                  placeholder="اسم الصنف"
                  value={form.itemName}
                  onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">سعر التكلفة (جنيه)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="سعر التكلفة"
                  value={form.costPrice}
                  onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الكمية</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="الكمية"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-blue-100 active:scale-[0.98]"
              >
                {saving ? "جارٍ الإضافة…" : "إضافة مشتريات"}
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
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-200">لا توجد مشتريات.</p>
        ) : (
          <>
            {/* Mobile View: Cards Layout (sm:hidden) */}
            <div className="sm:hidden space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-gray-900 text-base leading-snug">{item.itemName}</h4>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 active:scale-95 transition"
                      title="حذف"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                    <div>
                      <span className="text-gray-400 font-bold block mb-0.5">سعر التكلفة</span>
                      <span className="text-gray-700 font-black">{item.costPrice.toLocaleString()} جنيه</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block mb-0.5">الكمية</span>
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => saveQty(item.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setEditQty(String(item.quantity)); }}
                          className="font-black text-blue-600 hover:underline text-sm block mt-0.5"
                        >
                          {item.quantity} (تعديل)
                        </button>
                      )}
                    </div>
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
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">الصنف</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">سعر التكلفة</th>
                      <th className="text-right px-5 py-4.5 font-bold text-gray-600">الكمية</th>
                      <th className="text-left px-5 py-4.5 font-bold text-gray-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-bold text-gray-900">{item.itemName}</td>
                        <td className="px-5 py-4 text-gray-600 font-semibold">{item.costPrice.toLocaleString()} جنيه</td>
                        <td className="px-5 py-4 text-gray-600 font-semibold">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                className="w-20 px-2.5 py-1 rounded-lg border border-gray-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => saveQty(item.id)}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingId(item.id); setEditQty(String(item.quantity)); }}
                              className="hover:underline font-bold text-gray-800"
                              title="اضغط لتعديل الكمية"
                            >
                              {item.quantity}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 text-left">
                          <button
                            onClick={() => setDeleteTarget(item.id)}
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
      </main>
    </div>
  );
}
